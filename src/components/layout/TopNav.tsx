import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  Settings,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthDisplay, getNextMonth, getPrevMonth, getCurrentMonthString } from '../../utils/date';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface TopNavProps {
  onToggleSidebar: () => void;
  onNavigateToSettings: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar, onNavigateToSettings }) => {
  const {
    selectedMonth,
    setSelectedMonth,
    setActiveModal,
    setEditingTransaction,
    notifications,
    markNotificationRead,
    clearNotifications,
  } = useFinance();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAdd = () => {
    setEditingTransaction(null);
    setActiveModal('transaction');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/90 dark:bg-[#121316]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Network Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white lg:hidden transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Connectivity status badge */}
        <OfflineIndicator variant="badge" />
      </div>

      {/* Center: Month Selector */}
      <div className="flex items-center gap-1 bg-white dark:bg-[#1C1D21] border border-[#EAEAE7] dark:border-[#2A2B30] rounded-lg p-1 shadow-xs">
        <button
          onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
          className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-3 text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 select-none">
          <Calendar className="w-3.5 h-3.5 text-neutral-400 hidden xs:inline" />
          <span>{formatMonthDisplay(selectedMonth)}</span>
          {selectedMonth !== getCurrentMonthString() && (
            <button
              onClick={() => setSelectedMonth(getCurrentMonthString())}
              className="text-[11px] text-[#588157] hover:underline ml-1 font-mono"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
          className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button (desktop/android/iOS) */}
        <PWAInstallButton variant="nav" />

        {/* Primary Action Button */}
        <button
          onClick={handleQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden xs:inline">New Transaction</span>
          <span className="xs:hidden">Add</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Activity Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A3B18A] text-[10px] font-bold text-white ring-2 ring-[#F5F5F3] dark:ring-[#121316]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] shadow-lg z-50 p-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Notifications ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-neutral-400 hover:text-[#BC4749] flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#EAEAE7] dark:divide-[#2A2B30] mt-1 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-400">
                    No new activity
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-lg my-1 transition-colors cursor-pointer ${
                        n.read ? 'opacity-50' : 'bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#40916C] shrink-0 mt-0.5" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#C99757] shrink-0 mt-0.5" />}
                        {n.type === 'info' && <Info className="w-4 h-4 text-[#A3B18A] shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-900 dark:text-white">{n.title}</p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings shortcut */}
        <button
          onClick={onNavigateToSettings}
          className="p-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
