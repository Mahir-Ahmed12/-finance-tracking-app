import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { CategoriesView } from './views/CategoriesView';
import { BudgetsView } from './views/BudgetsView';
import { AnalyticsView } from './views/AnalyticsView';
import { AccountsView } from './views/AccountsView';
import { SavingsGoalsView } from './views/SavingsGoalsView';
import { CalendarView } from './views/CalendarView';
import { AIAssistantView } from './views/AIAssistantView';
import { SettingsView } from './views/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { TransferModal } from './components/accounts/TransferModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

function AppContent() {
  const { isLoading } = useFinance();
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize theme from user preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('neonvault_theme_mode');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F3] dark:bg-[#121316] text-neutral-800 dark:text-neutral-200">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-[#588157] animate-spin mb-3" />
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
          Loading Ledger...
        </span>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToRecurring={() => setActiveTab('dashboard')}
            onNavigateToBudgets={() => setActiveTab('budgets')}
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'categories':
        return <CategoriesView />;
      case 'budgets':
        return <BudgetsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'accounts':
        return <AccountsView />;
      case 'goals':
        return <SavingsGoalsView />;
      case 'calendar':
        return <CalendarView />;
      case 'ai':
        return <AIAssistantView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToRecurring={() => setActiveTab('dashboard')}
            onNavigateToBudgets={() => setActiveTab('budgets')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F3] dark:bg-[#121316] text-[#171717] dark:text-[#EDEDED] antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onToggleSidebar={() => setSidebarOpen(true)}
          onNavigateToSettings={() => setActiveTab('settings')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals & Offline Connectivity Toast */}
      <TransactionModal />
      <TransferModal />
      <OfflineIndicator variant="floating" />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
