export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  toAccountId?: string; // only for transfer
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  description?: string;
  tags?: string[];
  isRecurringInstance?: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  budgetLimit?: number; // optional default monthly budget
  isArchived?: boolean;
  isCustom?: boolean;
}

export type AccountType = 'cash' | 'bank' | 'mobile_banking' | 'savings' | 'credit_card' | 'custom';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  color: string;
  icon: string;
  accountNumberMask?: string;
  isArchived?: boolean;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM
  overallLimit: number;
  categoryLimits: Record<string, number>; // categoryId -> limit
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  paymentMethod: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  lastGeneratedDate?: string;
  active: boolean;
  description?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  categoryId?: string;
  color: string;
  icon: string;
  notes?: string;
  createdAt: string;
  isCompleted?: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: 'prefix' | 'suffix';
}

export interface UserSettings {
  currency: CurrencyConfig;
  defaultAccountId: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  defaultMonthlyBudget: number;
  aiConsent: boolean;
  theme: 'light' | 'dark' | 'cyber-dark' | 'neon-purple' | 'matrix-green';
}

export interface FinancialSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  overallBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  transactionCount: number;
}
