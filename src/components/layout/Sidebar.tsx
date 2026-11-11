import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  PieChart,
  BarChart3,
  Wallet,
  Target,
  Calendar,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCompactCurrency } from '../../utils/math';

export type NavItemKey =
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'analytics'
  | 'accounts'
  | 'goals'
  | 'calendar'
  | 'ai'
  | 'settings';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { totalNetWorth, settings, currentMonthTransactions } = useFinance();

  const navItems: { key: NavItemKey; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'transactions', label: 'Transactions', icon: Receipt, badge: `${currentMonthTransactions.length}` },
    { key: 'categories', label: 'Categories', icon: Tags },
    { key: 'budgets', label: 'Budgets', icon: PieChart },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'accounts', label: 'Accounts', icon: Wallet },
    { key: 'goals', label: 'Savings Goals', icon: Target },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'ai', label: 'AI Insights', icon: Sparkles, badge: 'AI' },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (key: NavItemKey) => {
    onSelectTab(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col border-r border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3] dark:bg-[#121316] transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
          <div
            className={`flex items-center gap-2.5 cursor-pointer overflow-hidden ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            onClick={() => handleNavClick('dashboard')}
          >
            {/* Minimal Monogram Icon */}
            <div className="w-8 h-8 rounded-lg bg-[#171717] dark:bg-white flex items-center justify-center shrink-0">
              <span className="font-heading font-extrabold text-sm text-white dark:text-[#171717] tracking-tighter">
                NV
              </span>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-heading font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                  NEONVAULT
                </span>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                  Financial OS
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
              title="Collapse"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
              title="Expand"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-[#1C1D21] text-neutral-900 dark:text-white border border-[#EAEAE7] dark:border-[#2A2B30] shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#588157] dark:text-[#A3B18A]' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between text-left truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          item.badge === 'AI'
                            ? 'bg-[#A3B18A]/20 text-[#3A5A40] dark:text-[#A3B18A] font-semibold'
                            : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Minimalist Summary */}
        <div className="p-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
          {!isCollapsed ? (
            <div className="p-3 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21]">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                <span>Net Balance</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
              </div>
              <div className="text-base font-semibold font-mono text-neutral-900 dark:text-white">
                {formatCompactCurrency(totalNetWorth, settings.currency)}
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2" title="Net Balance">
              <span className="w-2 h-2 rounded-full bg-[#A3B18A]" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
