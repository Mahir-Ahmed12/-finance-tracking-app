import React, { useState } from 'react';
import { Download, Share, X, CheckCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'button' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running standalone and mounted as a navigation action, suppress
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-3 rounded-xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#2D6A4F] dark:text-[#52B788]">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">NEONVAULT is installed in Standalone Mode</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">PWA Active</span>
        </div>
      );
    }
    return null;
  }

  // Chromium / Desktop / Android flow
  if (isInstallable) {
    if (variant === 'nav') {
      return (
        <button
          onClick={install}
          title="Install NEONVAULT desktop/mobile app"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 transition-all shadow-xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 stroke-[2]" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      );
    }

    if (variant === 'card') {
      return (
        <div className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white">Install NEONVAULT</h4>
            <p className="text-neutral-500 text-[11px] mt-0.5">
              Launch directly from your home screen or dock with instant offline access and standalone window.
            </p>
          </div>
          <button
            onClick={install}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 shrink-0 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 stroke-[2]" />
            <span>Install Now</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          title="Install on iPhone / iPad"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#588157] dark:text-[#A3B18A]" />
          <span className="hidden sm:inline">Install iOS</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] p-6 shadow-2xl text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE7] dark:border-[#2A2B30]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    Install on iOS Home Screen
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 my-4 text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30]">
                  <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-mono text-[10px] shrink-0 font-medium text-neutral-800 dark:text-white">
                    1
                  </span>
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-white">Tap the Share icon</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      In the Safari browser bottom toolbar, tap the <Share className="w-3 h-3 inline mx-0.5" /> Share icon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-[#EAEAE7] dark:border-[#2A2B30]">
                  <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-mono text-[10px] shrink-0 font-medium text-neutral-800 dark:text-white">
                    2
                  </span>
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-white">Add to Home Screen</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Scroll down the share sheet and select <strong>&quot;Add to Home Screen&quot;</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 rounded-xl text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers without beforeinstallprompt event yet (e.g. desktop Firefox or prior to prompt event)
  if (variant === 'card') {
    return (
      <div className="p-4 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/50 dark:bg-[#121316]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white">Progressive Web App Ready</h4>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            Use your browser&apos;s address bar icon (Chrome, Edge, or Brave) or mobile menu to install NEONVAULT.
          </p>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 border border-[#EAEAE7] dark:border-[#2A2B30] px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto">
          PWA Compatible
        </span>
      </div>
    );
  }

  return null;
};
