import React, { useState } from 'react';
import { formatCurrency, formatCompactCurrency } from '../../utils/math';
import { CurrencyConfig } from '../../types/finance';

// ==========================================
// 1. MINIMAL DONUT CHART (Category Breakdown)
// ==========================================
interface DonutSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
  icon?: string;
}

interface CyberDonutChartProps {
  data: DonutSlice[];
  currency: CurrencyConfig;
  totalLabel?: string;
  size?: number;
}

export const CyberDonutChart: React.FC<CyberDonutChartProps> = ({
  data,
  currency,
  totalLabel = 'Total Expenses',
  size = 220,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const strokeWidth = 20;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-neutral-400">
        <div className="w-24 h-24 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-2">
          <span className="text-[11px] font-mono text-neutral-400">No Data</span>
        </div>
        <p className="text-xs text-neutral-500">No expenses recorded for this period</p>
      </div>
    );
  }

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Subtle Background Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={strokeWidth}
          />
          {/* Data Slices */}
          {data.map((slice, i) => {
            const slicePercent = slice.value / total;
            const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += slicePercent;

            const isHovered = hoveredIdx === i;

            return (
              <circle
                key={slice.label + i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-150 cursor-pointer origin-center"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  opacity: hoveredIdx !== null && !isHovered ? 0.35 : 1,
                  transformOrigin: '50% 50%',
                }}
              />
            );
          })}
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {hoveredIdx !== null ? (
            <>
              <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[120px]">
                {data[hoveredIdx].label}
              </span>
              <span className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5 font-mono">
                {formatCurrency(data[hoveredIdx].value, currency, { decimals: 0 })}
              </span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                {data[hoveredIdx].percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                {totalLabel}
              </span>
              <span className="text-lg font-semibold text-neutral-900 dark:text-white mt-0.5 font-mono">
                {formatCompactCurrency(total, currency)}
              </span>
              <span className="text-[11px] text-neutral-400 mt-0.5">
                {data.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Clean Minimalist Legends */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
        {data.slice(0, 8).map((slice, i) => (
          <div
            key={slice.label + i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
              hoveredIdx === i
                ? 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-600'
                : 'bg-transparent border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
            }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate font-medium">
                {slice.label}
              </span>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-200">
                {formatCompactCurrency(slice.value, currency)}
              </div>
              <div className="text-[10px] text-neutral-400">
                {slice.percentage.toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 2. MINIMAL BAR COMPARISON CHART (Income vs Expense)
// ==========================================
interface BarComparisonItem {
  period: string;
  income: number;
  expense: number;
  net?: number;
}

interface CyberBarComparisonChartProps {
  data: BarComparisonItem[];
  currency: CurrencyConfig;
  height?: number;
}

export const CyberBarComparisonChart: React.FC<CyberBarComparisonChartProps> = ({
  data,
  currency,
  height = 200,
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: BarComparisonItem | null;
  }>({ visible: false, x: 0, y: 0, item: null });

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  return (
    <div className="relative w-full">
      {/* Chart Legend */}
      <div className="flex items-center justify-end gap-5 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#40916C]" />
          <span className="text-neutral-600 dark:text-neutral-400 font-medium">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C85A5A]" />
          <span className="text-neutral-600 dark:text-neutral-400 font-medium">Expense</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full relative" style={{ height }}>
        {/* Subtle horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-[#EAEAE7] dark:border-[#2A2B30] w-full" />
          <div className="border-b border-[#EAEAE7] dark:border-[#2A2B30] w-full" />
          <div className="border-b border-[#EAEAE7] dark:border-[#2A2B30] w-full" />
          <div className="border-b border-[#EAEAE7] dark:border-[#2A2B30] w-full" />
        </div>

        {/* Bars Container */}
        <div className="absolute inset-0 flex items-end justify-between px-2 pt-2 pb-6 gap-2">
          {data.map((item, idx) => {
            const incomeHeight = (item.income / maxVal) * (height - 30);
            const expenseHeight = (item.expense / maxVal) * (height - 30);

            return (
              <div
                key={item.period + idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    visible: true,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    item,
                  });
                }}
                onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
              >
                {/* Slender Minimal Bars */}
                <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                  {/* Income Bar (muted green) */}
                  <div
                    style={{ height: `${Math.max(incomeHeight, 3)}px` }}
                    className="w-1/2 rounded-t-[3px] bg-[#40916C] dark:bg-[#52B788] transition-all duration-150 group-hover:opacity-85"
                  />
                  {/* Expense Bar (muted terracotta) */}
                  <div
                    style={{ height: `${Math.max(expenseHeight, 3)}px` }}
                    className="w-1/2 rounded-t-[3px] bg-[#C85A5A] dark:bg-[#E07A5F] transition-all duration-150 group-hover:opacity-85"
                  />
                </div>

                {/* X-axis Label */}
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-2 truncate max-w-full">
                  {item.period}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clean Floating Tooltip */}
      {tooltip.visible && tooltip.item && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] shadow-lg text-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1 mb-1.5">
            {tooltip.item.period}
          </div>
          <div className="text-[#2D6A4F] dark:text-[#52B788] flex items-center justify-between gap-4 font-mono text-[11px]">
            <span>Income</span>
            <span>{formatCurrency(tooltip.item.income, currency)}</span>
          </div>
          <div className="text-[#BC4749] dark:text-[#E07A5F] flex items-center justify-between gap-4 font-mono text-[11px] mt-0.5">
            <span>Expense</span>
            <span>{formatCurrency(tooltip.item.expense, currency)}</span>
          </div>
          <div className="text-neutral-700 dark:text-neutral-300 flex items-center justify-between gap-4 pt-1 mt-1 border-t border-neutral-100 dark:border-neutral-800 font-mono text-[11px] font-medium">
            <span>Net</span>
            <span>{formatCurrency(tooltip.item.income - tooltip.item.expense, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. MINIMAL AREA TREND CHART
// ==========================================
interface TrendPoint {
  label: string;
  value: number;
}

interface CyberAreaTrendChartProps {
  data: TrendPoint[];
  currency: CurrencyConfig;
  height?: number;
  strokeColor?: string;
  gradientId?: string;
}

export const CyberAreaTrendChart: React.FC<CyberAreaTrendChartProps> = ({
  data,
  currency,
  height = 170,
  strokeColor = '#A3B18A', // Muted sage green accent
  gradientId = 'minimal-trend-grad',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="text-center py-6 text-xs text-neutral-400">No trend data available</div>;
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 100);
  const range = maxVal - minVal || 1;

  const width = 600;
  const paddingX = 20;
  const paddingY = 20;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Minimal Subtle Area Fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Clean Hairline Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Minimal Data Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 5 : 3}
              className="cursor-pointer transition-all duration-150 fill-white dark:fill-[#1C1D21]"
              stroke={strokeColor}
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Clean X-axis text */}
            <text
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              className="text-[10px] fill-neutral-400 font-sans"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Minimal Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-lg border border-[#EAEAE7] dark:border-[#2A2B30] bg-white dark:bg-[#1C1D21] shadow-md text-xs -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(hoveredIndex / (data.length - 1 || 1)) * 100}%`,
            top: `${points[hoveredIndex].y - 8}px`,
          }}
        >
          <span className="text-neutral-500 block text-[10px]">{points[hoveredIndex].label}</span>
          <span className="font-semibold text-neutral-900 dark:text-white font-mono">
            {formatCurrency(points[hoveredIndex].value, currency)}
          </span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. MINIMAL DAILY ACTIVITY CHART
// ==========================================
interface DailySpendProps {
  days: { day: number; amount: number; isToday?: boolean }[];
  currency: CurrencyConfig;
}

export const CyberDailyActivityBar: React.FC<DailySpendProps> = ({ days, currency }) => {
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);
  const maxAmount = Math.max(...days.map((d) => d.amount), 500);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-16 pt-2 pb-1">
        {days.map((d) => {
          const heightPct = Math.max((d.amount / maxAmount) * 100, 4);
          const hasSpend = d.amount > 0;

          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-[2px] transition-colors duration-150 ${
                  d.isToday
                    ? 'bg-[#A3B18A]'
                    : hasSpend
                    ? 'bg-neutral-300 dark:bg-neutral-700 group-hover:bg-[#A3B18A]'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1 border-t border-[#EAEAE7] dark:border-[#2A2B30] pt-1.5 font-mono">
        <span>Day 01</span>
        {hoveredDay ? (
          <span className="text-neutral-900 dark:text-white font-medium">
            Day {hoveredDay.day}: {formatCurrency(hoveredDay.amount, currency)}
          </span>
        ) : (
          <span>Month Activity</span>
        )}
        <span>Day {days.length}</span>
      </div>
    </div>
  );
};

// ==========================================
// 5. MINIMAL FINANCIAL HEALTH GAUGE
// ==========================================
interface CyberHealthGaugeProps {
  score: number;
  savingsRate: number;
  budgetUtilization: number;
}

export const CyberHealthGauge: React.FC<CyberHealthGaugeProps> = ({
  score,
  savingsRate,
  budgetUtilization,
}) => {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const stroke = 8;
  const radius = 50;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let rating = 'Critical';
  let ratingColor = '#BC4749';
  if (normalizedScore >= 80) {
    rating = 'Excellent';
    ratingColor = '#40916C';
  } else if (normalizedScore >= 60) {
    rating = 'Healthy';
    ratingColor = '#A3B18A';
  } else if (normalizedScore >= 40) {
    rating = 'Moderate';
    ratingColor = '#C99757';
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-20 overflow-hidden flex items-end justify-center">
        <svg width="130" height="70" viewBox="0 0 130 70" className="overflow-visible">
          {/* Base track */}
          <path
            d="M 15 65 A 50 50 0 0 1 115 65"
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Active arc */}
          <path
            d="M 15 65 A 50 50 0 0 1 115 65"
            fill="none"
            stroke={ratingColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-2xl font-semibold font-mono tracking-tight text-neutral-900 dark:text-white leading-none">
            {normalizedScore}
          </span>
          <span
            className="text-[11px] font-medium tracking-wide mt-1"
            style={{ color: ratingColor }}
          >
            {rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-2.5 border-t border-[#EAEAE7] dark:border-[#2A2B30] text-xs font-mono">
        <div className="text-center">
          <div className="text-neutral-500 text-[10px]">Savings</div>
          <div className="text-neutral-900 dark:text-white font-medium">{savingsRate.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-neutral-500 text-[10px]">Budget Load</div>
          <div className={budgetUtilization > 100 ? 'text-[#BC4749] font-medium' : 'text-neutral-900 dark:text-white font-medium'}>
            {budgetUtilization.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
