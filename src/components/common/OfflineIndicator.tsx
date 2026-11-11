import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  variant?: 'badge' | 'floating';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ variant = 'badge' }) => {
  const isOnline = useOnlineStatus();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Monitor transitions to show a temporary notification when connectivity changes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isOnline) {
      setToastMessage('Offline mode active. Ledger operating locally via IndexedDB.');
      setShowToast(true);
    } else {
      setToastMessage('Connection restored. You are back online.');
      setShowToast(true);
      timer = setTimeout(() => setShowToast(false), 3500);
    }

    return () => clearTimeout(timer);
  }, [isOnline]);

  if (variant === 'floating') {
    if (!showToast && isOnline) return null;

    return (
      <div
        className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shadow-lg transition-all duration-300 border ${
          isOnline
            ? 'bg-[#2D6A4F] text-white border-[#40916C]/40'
            : 'bg-[#B07219] dark:bg-[#D48B28] text-white border-amber-400/40'
        }`}
      >
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
        )}
        <span>{toastMessage}</span>
      </div>
    );
  }

  // TopNav badge variant
  return (
    <div
      title={
        isOnline
          ? 'Online: Real-time network active'
          : 'Offline: Financial ledger operating locally via persistent IndexedDB'
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
        isOnline
          ? 'bg-neutral-50 dark:bg-neutral-800/60 border-[#EAEAE7] dark:border-[#2A2B30] text-neutral-600 dark:text-neutral-400'
          : 'bg-[#D48B28]/15 border-[#D48B28]/40 text-[#D48B28] dark:text-[#E9A23B]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isOnline ? 'bg-[#40916C]' : 'bg-[#D48B28] animate-pulse'
        }`}
      />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};
