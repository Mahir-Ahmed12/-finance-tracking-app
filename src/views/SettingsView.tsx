import React, { useState, useRef } from 'react';
import {
  Settings,
  DollarSign,
  Moon,
  Sun,
  HardDrive,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SUPPORTED_CURRENCIES } from '../utils/math';
import { CurrencyConfig, Account } from '../types/finance';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    accounts,
    exportJSON,
    exportCSV,
    restoreJSON,
    resetAllData,
  } = useFinance();

  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency.code);
  const [defaultAccount, setDefaultAccount] = useState(settings.defaultAccountId);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [defaultBudget, setDefaultBudget] = useState(settings.defaultMonthlyBudget.toString());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const curr = SUPPORTED_CURRENCIES.find((c: CurrencyConfig) => c.code === selectedCurrency) || settings.currency;
    const budgetNum = parseFloat(defaultBudget);

    await updateSettings({
      currency: curr,
      defaultAccountId: defaultAccount,
      dateFormat: dateFormat as any,
      defaultMonthlyBudget: !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : settings.defaultMonthlyBudget,
    });

    setStatusMessage('Settings updated successfully.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleTheme = async (theme: 'cyber-dark' | 'neon-purple' | 'matrix-green') => {
    await updateSettings({ theme });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await restoreJSON(content);
      if (res.success) {
        setStatusMessage(`Successfully restored ${res.count} records from backup.`);
      } else {
        alert(`Restore error: ${res.error || 'Failed to parse file'}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'WARNING: This will reset all your transactions, categories, and accounts back to clean initial starter data. Proceed?'
      )
    ) {
      setIsResetting(true);
      await resetAllData();
      setIsResetting(false);
      setStatusMessage('Data reset to default clean state.');
    }
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('neonvault_theme_mode', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('neonvault_theme_mode', 'dark');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="min-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-base text-neutral-900 dark:text-white">
              System Settings & Preferences
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure currencies, appearance themes, automated backups, and data persistence.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-[#588157]/10 border border-[#588157]/30 text-[#2D6A4F] dark:text-[#52B788] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Appearance & Theme */}
        <div className="min-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white border-b border-[#EAEAE7] dark:border-[#2A2B30] pb-2">
            Appearance
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block">
                Interface Color Scheme
              </span>
              <span className="text-xs text-neutral-500">
                Switch between Minimal Light (#F5F5F3) and Minimal Charcoal (#121316)
              </span>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <Sun className="w-3.5 h-3.5 dark:hidden" />
              <Moon className="w-3.5 h-3.5 hidden dark:inline" />
              <span>Toggle Mode</span>
            </button>
          </div>
        </div>

        {/* Financial Preferences */}
        <div className="min-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white border-b border-[#EAEAE7] dark:border-[#2A2B30] pb-2">
            Financial Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Display Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs"
              >
                {SUPPORTED_CURRENCIES.map((c: CurrencyConfig) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Account */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Default Account for Transactions
              </label>
              <select
                value={defaultAccount}
                onChange={(e) => setDefaultAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs"
              >
                {accounts
                  .filter((a: Account) => !a.isArchived)
                  .map((a: Account) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Date Presentation Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              </select>
            </div>

            {/* Default Monthly Budget Limit */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Default Monthly Budget Target
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={defaultBudget}
                onChange={(e) => setDefaultBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 transition-all shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </form>

      {/* Progressive Web App & Offline Execution */}
      <div className="min-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAEAE7] dark:border-[#2A2B30] pb-2">
          <div>
            <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white">
              Progressive Web App (PWA)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Install NEONVAULT natively on Desktop (Chrome, Edge, Brave), Android, or iOS with full offline execution.
            </p>
          </div>
        </div>

        <PWAInstallButton variant="card" />
      </div>

      {/* Data Backup & Portability */}
      <div className="min-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-neutral-900 dark:text-white border-b border-[#EAEAE7] dark:border-[#2A2B30] pb-2">
          Data Management & Portability
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* JSON Export */}
          <div className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-neutral-50/60 dark:bg-neutral-800/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block mb-0.5">
                Full System Backup (JSON)
              </span>
              <p className="text-[11px] text-neutral-500">
                Exports all transactions, categories, budgets, and savings goals into a portable JSON snapshot.
              </p>
            </div>
            <button
              onClick={exportJSON}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup</span>
            </button>
          </div>

          {/* JSON Restore */}
          <div className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-neutral-50/60 dark:bg-neutral-800/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block mb-0.5">
                Restore From Backup
              </span>
              <p className="text-[11px] text-neutral-500">
                Restores and validates a previously downloaded JSON backup file into your IndexedDB database.
              </p>
            </div>
            <label className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Backup File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* CSV Export */}
          <div className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-neutral-50/60 dark:bg-neutral-800/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block mb-0.5">
                Ledger Spreadsheet (CSV)
              </span>
              <p className="text-[11px] text-neutral-500">
                Download a clean spreadsheet for accounting in Microsoft Excel or Google Sheets.
              </p>
            </div>
            <button
              onClick={exportCSV}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Storage Diagnostic */}
          <div className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-neutral-50/60 dark:bg-neutral-800/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-neutral-900 dark:text-white block mb-0.5">
                Local-First Persistence
              </span>
              <p className="text-[11px] text-neutral-500">
                IndexedDB persistence verified. Records survive refreshes and browser restarts.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#2D6A4F] dark:text-[#52B788] font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>IndexedDB Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="min-card p-6 border-red-200 dark:border-red-950/40 bg-red-50/20 dark:bg-red-950/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-[#BC4749]">Danger Zone</h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Permanently clear all user records and return the application to initial factory state.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#BC4749] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
