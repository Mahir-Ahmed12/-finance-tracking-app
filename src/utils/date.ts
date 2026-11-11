import { RecurringFrequency } from '../types/finance';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthDisplay(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function getPrevMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatDateCustom(dateStr: string, format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

export function formatRelativeDate(dateStr: string): string {
  const today = getTodayString();
  if (dateStr === today) return 'Today';
  
  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = dateStr.split('-').map(Number);
  
  const diffDays = Math.round(
    (new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < -1 && diffDays > -7) return `In ${Math.abs(diffDays)} days`;

  const date = new Date(y2, m2 - 1, d2);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function computeNextRecurringDate(currentDateStr: string, frequency: RecurringFrequency): string {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthDaysArray(monthStr: string): { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] {
  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dNum = prevMonthLastDay - i;
    const prevM = month - 1 === 0 ? 12 : month - 1;
    const prevY = month - 1 === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: dNum, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: i, isCurrentMonth: true });
  }

  // Next month leading days to complete the 35 or 42 grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextM = month + 1 === 13 ? 1 : month + 1;
    const nextY = month + 1 === 13 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: i, isCurrentMonth: false });
  }

  return days;
}
