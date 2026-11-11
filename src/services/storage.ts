import {
  Account,
  Category,
  MonthlyBudget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserSettings,
} from '../types/finance';
import { DEFAULT_CURRENCY, safeAdd, safeSub } from '../utils/math';
import { getCurrentMonthString, getTodayString } from '../utils/date';

const DB_NAME = 'neonvault_db';
const DB_VERSION = 1;

interface SchemaStores {
  transactions: Transaction;
  categories: Category;
  accounts: Account;
  budgets: MonthlyBudget;
  recurring: RecurringTransaction;
  savingsGoals: SavingsGoal;
  settings: { key: string; value: unknown };
}

// Open IndexedDB database with Promise wrapper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
        txStore.createIndex('categoryId', 'categoryId', { unique: false });
        txStore.createIndex('accountId', 'accountId', { unique: false });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('accounts')) {
        db.createObjectStore('accounts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('recurring')) {
        db.createObjectStore('recurring', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('savingsGoals')) {
        db.createObjectStore('savingsGoals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback localStorage helpers in case IndexedDB has restrictive sandboxing
function localGet<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(`neonvault_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function localSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`neonvault_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Generic IndexedDB read all
async function getAllFromStore<T>(storeName: keyof SchemaStores): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return localGet<T[]>(storeName, []);
  }
}

// Generic put (insert or replace)
async function putInStore<T>(storeName: keyof SchemaStores, item: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const items = localGet<any[]>(storeName, []);
    const idKey = 'id' in (item as any) ? 'id' : 'key';
    const index = items.findIndex((x) => x[idKey] === (item as any)[idKey]);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localSet(storeName, items);
  }
}

// Generic delete
async function deleteFromStore(storeName: keyof SchemaStores, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const items = localGet<any[]>(storeName, []);
    const filtered = items.filter((x) => (x.id || x.key) !== key);
    localSet(storeName, filtered);
  }
}

// Seed Starter Data (All default to 0)
export function getStarterCategories(): Category[] {
  return [
    // Expense Categories
    { id: 'cat-exp-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f43f5e' },
    { id: 'cat-exp-trans', name: 'Transportation', type: 'expense', icon: 'Car', color: '#06b6d4' },
    { id: 'cat-exp-edu', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#3b82f6' },
    { id: 'cat-exp-shop', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
    { id: 'cat-exp-ent', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6' },
    { id: 'cat-exp-bills', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#eab308' },
    { id: 'cat-exp-rent', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#6366f1' },
    { id: 'cat-exp-health', name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#10b981' },
    { id: 'cat-exp-travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#14b8a6' },
    { id: 'cat-exp-care', name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#d946ef' },
    { id: 'cat-exp-subs', name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#c084fc' },
    { id: 'cat-exp-family', name: 'Family', type: 'expense', icon: 'Users', color: '#f97316' },
    { id: 'cat-exp-tech', name: 'Technology', type: 'expense', icon: 'Cpu', color: '#00f0ff' },
    { id: 'cat-exp-other', name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },

    // Income Categories
    { id: 'cat-inc-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981' },
    { id: 'cat-inc-freelance', name: 'Freelancing', type: 'income', icon: 'Laptop', color: '#06b6d4' },
    { id: 'cat-inc-biz', name: 'Business', type: 'income', icon: 'Building', color: '#3b82f6' },
    { id: 'cat-inc-scholar', name: 'Scholarship', type: 'income', icon: 'Award', color: '#8b5cf6' },
    { id: 'cat-inc-invest', name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#eab308' },
    { id: 'cat-inc-gifts', name: 'Gifts', type: 'income', icon: 'Gift', color: '#ec4899' },
    { id: 'cat-inc-side', name: 'Side Hustle', type: 'income', icon: 'Flame', color: '#f97316' },
    { id: 'cat-inc-other', name: 'Other', type: 'income', icon: 'PlusCircle', color: '#64748b' },
  ];
}

export function getStarterAccounts(): Account[] {
  return [
    { id: 'acc-cash', name: 'Cash Reserve', type: 'cash', balance: 0, initialBalance: 0, color: '#10b981', icon: 'Banknote' },
    { id: 'acc-bank', name: 'City Bank Core', type: 'bank', balance: 0, initialBalance: 0, color: '#06b6d4', icon: 'Landmark', accountNumberMask: '•••• 4092' },
    { id: 'acc-mobile', name: 'bKash Wallet', type: 'mobile_banking', balance: 0, initialBalance: 0, color: '#ec4899', icon: 'Smartphone', accountNumberMask: '017•••••88' },
    { id: 'acc-savings', name: 'High-Yield Vault', type: 'savings', balance: 0, initialBalance: 0, color: '#8b5cf6', icon: 'PiggyBank' },
    { id: 'acc-credit', name: 'Platinum Card', type: 'credit_card', balance: 0, initialBalance: 0, color: '#f43f5e', icon: 'CreditCard', accountNumberMask: '•••• 8821' },
  ];
}

export function getStarterSavingsGoals(): SavingsGoal[] {
  return [];
}

export function getStarterRecurring(): RecurringTransaction[] {
  return [];
}

export function getStarterTransactions(): Transaction[] {
  return [];
}

export function getDefaultSettings(): UserSettings {
  return {
    currency: DEFAULT_CURRENCY,
    defaultAccountId: 'acc-bank',
    dateFormat: 'YYYY-MM-DD',
    defaultMonthlyBudget: 0,
    aiConsent: true,
    theme: 'light',
  };
}

const ZERO_INIT_KEY = 'neonvault_zero_data_v2';

export const StorageService = {
  // Initialization & Check
  async initialize(): Promise<{
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    budgets: MonthlyBudget[];
    recurring: RecurringTransaction[];
    savingsGoals: SavingsGoal[];
    settings: UserSettings;
  }> {
    // Migration: One-time reset to pure 0-state if not yet performed
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(ZERO_INIT_KEY) !== 'true') {
        const db = await openDB();
        const stores: (keyof SchemaStores)[] = [
          'transactions',
          'categories',
          'accounts',
          'budgets',
          'recurring',
          'savingsGoals',
          'settings',
        ];
        for (const storeName of stores) {
          try {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).clear();
          } catch {
            // ignore
          }
        }
        localStorage.setItem(ZERO_INIT_KEY, 'true');
      }
    } catch {
      // Continue safely
    }

    let categories = await getAllFromStore<Category>('categories');
    let accounts = await getAllFromStore<Account>('accounts');
    let transactions = await getAllFromStore<Transaction>('transactions');
    let recurring = await getAllFromStore<RecurringTransaction>('recurring');
    let savingsGoals = await getAllFromStore<SavingsGoal>('savingsGoals');
    let budgets = await getAllFromStore<MonthlyBudget>('budgets');
    
    // Settings check
    let settingsWrapper = await getAllFromStore<{ key: string; value: UserSettings }>('settings');
    let settings = settingsWrapper.find((x) => x.key === 'user_settings')?.value || getDefaultSettings();

    // Starter seed for categories (standard setup)
    if (!categories.length) {
      categories = getStarterCategories();
      for (const cat of categories) await putInStore('categories', cat);
    }
    // Starter seed for accounts (all initialized to 0)
    if (!accounts.length) {
      accounts = getStarterAccounts();
      for (const acc of accounts) await putInStore('accounts', acc);
    }
    // Savings goals default to empty (0)
    if (!savingsGoals.length) {
      savingsGoals = getStarterSavingsGoals();
      for (const goal of savingsGoals) await putInStore('savingsGoals', goal);
    }
    // Recurring transactions default to empty (0)
    if (!recurring.length) {
      recurring = getStarterRecurring();
      for (const rec of recurring) await putInStore('recurring', rec);
    }
    // Transactions default to empty (0)
    if (!transactions.length) {
      transactions = getStarterTransactions();
      for (const tx of transactions) await putInStore('transactions', tx);
    }

    // Default monthly budget entry for current month with 0 limit
    const currentMonth = getCurrentMonthString();
    let currentBudget = budgets.find((b) => b.month === currentMonth);
    if (!currentBudget) {
      currentBudget = {
        id: `budget-${currentMonth}`,
        month: currentMonth,
        overallLimit: settings.defaultMonthlyBudget ?? 0,
        categoryLimits: {},
      };
      await putInStore('budgets', currentBudget);
      budgets.push(currentBudget);
    }

    return {
      transactions,
      categories,
      accounts,
      budgets,
      recurring,
      savingsGoals,
      settings,
    };
  },

  // Transactions CRUD
  async saveTransaction(tx: Transaction): Promise<void> {
    await putInStore('transactions', tx);
  },

  async deleteTransaction(id: string): Promise<void> {
    await deleteFromStore('transactions', id);
  },

  // Categories CRUD
  async saveCategory(cat: Category): Promise<void> {
    await putInStore('categories', cat);
  },

  async deleteCategory(id: string): Promise<void> {
    await deleteFromStore('categories', id);
  },

  // Accounts CRUD
  async saveAccount(acc: Account): Promise<void> {
    await putInStore('accounts', acc);
  },

  async deleteAccount(id: string): Promise<void> {
    await deleteFromStore('accounts', id);
  },

  // Budgets CRUD
  async saveBudget(budget: MonthlyBudget): Promise<void> {
    await putInStore('budgets', budget);
  },

  // Recurring CRUD
  async saveRecurring(rec: RecurringTransaction): Promise<void> {
    await putInStore('recurring', rec);
  },

  async deleteRecurring(id: string): Promise<void> {
    await deleteFromStore('recurring', id);
  },

  // Savings Goals CRUD
  async saveSavingsGoal(goal: SavingsGoal): Promise<void> {
    await putInStore('savingsGoals', goal);
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    await deleteFromStore('savingsGoals', id);
  },

  // Settings
  async saveSettings(settings: UserSettings): Promise<void> {
    await putInStore('settings', { key: 'user_settings', value: settings });
  },

  // Complete Export Backup
  async exportFullBackup(): Promise<string> {
    const data = {
      version: 1,
      appName: 'NEONVAULT',
      exportedAt: new Date().toISOString(),
      transactions: await getAllFromStore('transactions'),
      categories: await getAllFromStore('categories'),
      accounts: await getAllFromStore('accounts'),
      budgets: await getAllFromStore('budgets'),
      recurring: await getAllFromStore('recurring'),
      savingsGoals: await getAllFromStore('savingsGoals'),
      settings: (await getAllFromStore<{ key: string; value: UserSettings }>('settings'))
        .find((x) => x.key === 'user_settings')?.value || getDefaultSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Restore Backup with Integrity Validation & Deduplication
  async restoreBackup(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, count: 0, error: 'Invalid JSON payload structure' };
      }

      if (!Array.isArray(parsed.transactions) && !Array.isArray(parsed.categories)) {
        return { success: false, count: 0, error: 'Backup does not contain valid NEONVAULT collections' };
      }

      let restoredCount = 0;

      if (Array.isArray(parsed.categories)) {
        for (const cat of parsed.categories) {
          if (cat.id && cat.name) {
            await putInStore('categories', cat);
          }
        }
      }

      if (Array.isArray(parsed.accounts)) {
        for (const acc of parsed.accounts) {
          if (acc.id && acc.name) {
            await putInStore('accounts', acc);
          }
        }
      }

      if (Array.isArray(parsed.transactions)) {
        for (const tx of parsed.transactions) {
          if (tx.id && tx.title && typeof tx.amount === 'number') {
            await putInStore('transactions', tx);
            restoredCount++;
          }
        }
      }

      if (Array.isArray(parsed.budgets)) {
        for (const b of parsed.budgets) {
          if (b.id && b.month) {
            await putInStore('budgets', b);
          }
        }
      }

      if (Array.isArray(parsed.recurring)) {
        for (const r of parsed.recurring) {
          if (r.id && r.title) {
            await putInStore('recurring', r);
          }
        }
      }

      if (Array.isArray(parsed.savingsGoals)) {
        for (const g of parsed.savingsGoals) {
          if (g.id && g.title) {
            await putInStore('savingsGoals', g);
          }
        }
      }

      if (parsed.settings) {
        await putInStore('settings', { key: 'user_settings', value: parsed.settings });
      }

      return { success: true, count: restoredCount };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, count: 0, error: msg };
    }
  },

  // Clear / Reset All Data
  async resetAllData(): Promise<void> {
    try {
      const db = await openDB();
      const stores: (keyof SchemaStores)[] = [
        'transactions',
        'categories',
        'accounts',
        'budgets',
        'recurring',
        'savingsGoals',
        'settings',
      ];
      for (const storeName of stores) {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
      }
    } catch {
      // LocalStorage fallback
      localStorage.clear();
    }
  },
};
