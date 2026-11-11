import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Shield,
  Bot,
  User,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/math';
import { formatMonthDisplay } from '../utils/date';
import { Account } from '../types/finance';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    monthlyBudget,
    remainingBudget,
    topSpendingCategories,
    totalNetWorth,
    selectedMonth,
    settings,
    updateSettings,
    accounts,
  } = useFinance();

  const isOnline = useOnlineStatus();
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: `Hello. I am your NEONVAULT financial advisor. I have analyzed your ledger for ${formatMonthDisplay(selectedMonth)}. You have accumulated ${formatCurrency(totalIncome, settings.currency)} in income and disbursed ${formatCurrency(totalExpenses, settings.currency)} in expenses (savings rate: ${savingsRate.toFixed(1)}%). How can I help optimize your capital allocation today?`,
      timestamp: 'Just now',
    },
  ]);

  const quickQuestions = [
    'Where did my money go this month?',
    'Which category is consuming the most money?',
    'How much did I save this month?',
    'Compare my spending with last month.',
    'How much can I reasonably spend for the rest of this month?',
    'What are my biggest unnecessary expenses?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // If offline, provide deterministic local ledger analysis without crashing or hanging
    if (!isOnline) {
      setTimeout(() => {
        const offlineReply = generateOfflineInsight(textToSend, {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
          remainingBudget,
          topSpendingCategories,
          currency: settings.currency,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            sender: 'assistant',
            text: `[Offline Analysis] Internet connection is unavailable. Computed from your local IndexedDB ledger:\n\n${offlineReply}`,
            timestamp: 'Now',
          },
        ]);
        setIsLoading(false);
      }, 300);
      return;
    }

    // If user has not consented to AI or prefers deterministic offline insights
    if (!settings.aiConsent) {
      setTimeout(() => {
        const offlineReply = generateOfflineInsight(textToSend, {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
          remainingBudget,
          topSpendingCategories,
          currency: settings.currency,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            sender: 'assistant',
            text: offlineReply,
            timestamp: 'Now',
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      // Build safe financial snapshot
      const financialContext = {
        selectedMonth,
        currency: settings.currency,
        totalNetWorth,
        monthlyMetrics: {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
          monthlyBudgetCeiling: monthlyBudget.overallLimit,
          remainingBudget,
        },
        topCategories: topSpendingCategories.map((c: any) => ({
          name: c.category.name,
          amount: c.amount,
          percentage: c.percentage,
        })),
        accountBalances: accounts.map((a: Account) => ({
          name: a.name,
          type: a.type,
          balance: a.balance,
        })),
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          financialContext,
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        data.error ||
        generateOfflineInsight(textToSend, {
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
          remainingBudget,
          topSpendingCategories,
          currency: settings.currency,
        });

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: 'Now',
        },
      ]);
    } catch {
      // Graceful offline fallback
      const fallback = generateOfflineInsight(textToSend, {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        remainingBudget,
        topSpendingCategories,
        currency: settings.currency,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          sender: 'assistant',
          text: fallback,
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="min-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0">
              <Sparkles className="w-5 h-5 text-[#588157] dark:text-[#A3B18A]" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base text-neutral-900 dark:text-white">
                AI Financial Advisor
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Contextual insights powered by Gemini 3.8 Flash and verified ledger records.
              </p>
            </div>
          </div>

          {/* Privacy Consent Toggle */}
          <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-neutral-50 dark:bg-neutral-800/40 text-xs">
            <Shield className="w-3.5 h-3.5 text-[#588157] dark:text-[#A3B18A]" />
            <span className="text-neutral-600 dark:text-neutral-400">Gemini Cloud Sync:</span>
            <button
              onClick={() => updateSettings({ aiConsent: !settings.aiConsent })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                settings.aiConsent
                  ? 'bg-[#A3B18A]/20 text-[#3A5A40] dark:text-[#A3B18A]'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {settings.aiConsent ? 'Enabled' : 'Offline Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div>
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-2 px-1">
          Suggested Queries
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-left p-3 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] hover:border-neutral-300 dark:hover:border-neutral-600 text-xs text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Offline Status Alert if network is disconnected */}
      {!isOnline && (
        <div className="p-3.5 rounded-xl border border-[#D48B28]/30 bg-[#D48B28]/10 text-xs flex items-start gap-2.5">
          <WifiOff className="w-4 h-4 text-[#D48B28] shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[#87500A] dark:text-[#E9A23B] leading-relaxed">
            <span className="font-semibold block mb-0.5">Offline Mode Active</span>
            <span>
              Cloud neural AI requires an active internet connection. Your transactions, categories, budgets, accounts, and analytics operate 100% offline via local IndexedDB, and on-device deterministic financial insights are generated for any queries.
            </span>
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="min-card p-5 space-y-4">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 text-xs leading-relaxed ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 text-neutral-600 dark:text-neutral-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl p-3.5 rounded-xl ${
                  m.sender === 'user'
                    ? 'bg-[#171717] dark:bg-white text-white dark:text-[#171717]'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border border-[#EAEAE7] dark:border-[#2A2B30] text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <span
                  className={`block text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-neutral-400' : 'text-neutral-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5 text-neutral-700 dark:text-neutral-200">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing ledger data...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-[#EAEAE7] dark:border-[#2A2B30]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your income, spending habits, or budgets..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#EAEAE7] dark:border-[#2A2B30] bg-[#F5F5F3]/70 dark:bg-[#121316] text-neutral-900 dark:text-white text-xs sm:text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:opacity-90 disabled:opacity-40 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Deterministic offline financial auditor if Gemini is offline
function generateOfflineInsight(
  query: string,
  ctx: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    remainingBudget: number;
    topSpendingCategories: any[];
    currency: any;
  }
): string {
  const q = query.toLowerCase();

  if (q.includes('where') || q.includes('spending') || q.includes('consuming')) {
    if (ctx.topSpendingCategories.length === 0) {
      return `You have not recorded any expenses yet in this month.`;
    }
    const top = ctx.topSpendingCategories[0];
    const second = ctx.topSpendingCategories[1];
    let txt = `Based on your records, your largest expenditure category is **${top.category.name}** at ${formatCurrency(top.amount, ctx.currency)} (${top.percentage.toFixed(1)}% of total monthly spend).`;
    if (second) {
      txt += `\nYour second largest expenditure is **${second.category.name}** at ${formatCurrency(second.amount, ctx.currency)} (${second.percentage.toFixed(1)}%).`;
    }
    return txt;
  }

  if (q.includes('save') || q.includes('saved') || q.includes('rate')) {
    return `Your net savings this month is ${formatCurrency(ctx.netSavings, ctx.currency)}, yielding a savings rate of ${ctx.savingsRate.toFixed(1)}% from total income of ${formatCurrency(ctx.totalIncome, ctx.currency)}.`;
  }

  if (q.includes('spend') || q.includes('rest') || q.includes('reasonably')) {
    const today = new Date();
    const daysLeft = Math.max(30 - today.getDate(), 1);
    const dailyAllowance = Math.max(ctx.remainingBudget / daysLeft, 0);

    return `You have ${formatCurrency(ctx.remainingBudget, ctx.currency)} remaining in your monthly budget ceiling. Over the remaining ${daysLeft} days of the month, your recommended daily allowance is approximately ${formatCurrency(dailyAllowance, ctx.currency)}/day.`;
  }

  return `Financial Summary for selected period:\n• Income: ${formatCurrency(ctx.totalIncome, ctx.currency)}\n• Expenses: ${formatCurrency(ctx.totalExpenses, ctx.currency)}\n• Net Savings: ${formatCurrency(ctx.netSavings, ctx.currency)} (${ctx.savingsRate.toFixed(1)}%)\n• Remaining Budget: ${formatCurrency(ctx.remainingBudget, ctx.currency)}`;
}
