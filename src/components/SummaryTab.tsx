import { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Transaction, Category, AppSettings } from '../types';

interface SummaryTabProps {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
}

export default function SummaryTab({ transactions, categories, settings }: SummaryTabProps) {
  const symbol = settings.currencySymbol || '$';
  const [excludeLargeBills, setExcludeLargeBills] = useState<boolean>(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Filter transactions for current month (May 2026) and previous month (April 2026)
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith('2026-05'));
  const previousMonthTransactions = transactions.filter(t => t.date.startsWith('2026-04'));

  // Calculate overall metrics
  const getExpensesSum = (list: Transaction[], excludeFixed = false) => {
    return list
      .filter(t => t.type === 'expense' && (!excludeFixed || t.amount < 1000))
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const currentExpenses = getExpensesSum(currentMonthTransactions, false);
  const previousExpenses = getExpensesSum(previousMonthTransactions, false);

  const currentOperationalExpenses = getExpensesSum(currentMonthTransactions, excludeLargeBills);
  const previousOperationalExpenses = getExpensesSum(previousMonthTransactions, excludeLargeBills);

  // Percentage Change calculation
  const getPercentageChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const overallPercentageChange = getPercentageChange(currentExpenses, previousExpenses);
  const operationalPercentageChange = getPercentageChange(currentOperationalExpenses, previousOperationalExpenses);

  // Group daily expenditures (1 to 31) for April and May
  const getDailySums = (list: Transaction[], excludeFixed = false) => {
    const sums = Array(32).fill(0);
    list
      .filter(t => t.type === 'expense' && (!excludeFixed || t.amount < 1000))
      .forEach(t => {
        const day = parseInt(t.date.split('-')[2]);
        if (!isNaN(day) && day >= 1 && day <= 31) {
          sums[day] += t.amount;
        }
      });
    return sums;
  };

  const mayDaily = getDailySums(currentMonthTransactions, excludeLargeBills);
  const aprilDaily = getDailySums(previousMonthTransactions, excludeLargeBills);

  // Locate Peak Day in current month (excluding large bills depending on toggle)
  let peakDay = 1;
  let peakDayVal = 0;
  for (let d = 1; d <= 31; d++) {
    if (mayDaily[d] > peakDayVal) {
      peakDayVal = mayDaily[d];
      peakDay = d;
    }
  }

  // Get most expensive transaction of that Peak Day (or general peak)
  const peakDayDateStr = `2026-05-${String(peakDay).padStart(2, '0')}`;
  const peakDayTransactions = currentMonthTransactions.filter(
    t => t.type === 'expense' && t.date === peakDayDateStr && (!excludeLargeBills || t.amount < 1000)
  );

  const peakDayMostExpensiveItem = peakDayTransactions.reduce((acc: Transaction | null, curr) => {
    if (!acc) return curr;
    return curr.amount > acc.amount ? curr : acc;
  }, null);

  // Category summary for current month
  const categoryBreakdown = categories
    .filter(c => c.id !== 'salary')
    .map(cat => {
      const amount = currentMonthTransactions
        .filter(t => t.type === 'expense' && t.category === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const prevAmount = previousMonthTransactions
        .filter(t => t.type === 'expense' && t.category === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...cat,
        amount,
        prevAmount,
        percentageOfTotal: currentExpenses > 0 ? (amount / currentExpenses) * 100 : 0,
      };
    })
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // SVG Chart Dimensions & Computations
  const width = 800;
  const height = 240;
  const paddingX = 45;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max value to scale Y axis
  const maxVal = Math.max(
    ...mayDaily,
    ...aprilDaily,
    100 // baseline minimum height
  );

  const getCoordinates = (day: number, val: number) => {
    const x = paddingX + ((day - 1) / 30) * chartWidth;
    const y = height - paddingY - (val / maxVal) * chartHeight;
    return { x, y };
  };

  // Generate paths for May (solid emerald line) and April (dashed slate line)
  let mayPath = '';
  let aprilPath = '';

  for (let d = 1; d <= 31; d++) {
    const coordMay = getCoordinates(d, mayDaily[d]);
    const coordApr = getCoordinates(d, aprilDaily[d]);

    if (d === 1) {
      mayPath += `M ${coordMay.x} ${coordMay.y}`;
      aprilPath += `M ${coordApr.x} ${coordApr.y}`;
    } else {
      mayPath += ` L ${coordMay.x} ${coordMay.y}`;
      aprilPath += ` L ${coordApr.x} ${coordApr.y}`;
    }
  }

  // Gradient area underneath current month line
  let mayAreaPath = mayPath;
  if (mayPath) {
    const lastCoord = getCoordinates(31, mayDaily[31]);
    const firstCoord = getCoordinates(1, mayDaily[1]);
    mayAreaPath += ` L ${lastCoord.x} ${height - paddingY} L ${firstCoord.x} ${height - paddingY} Z`;
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `${symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div id="summary-section" className="flex-1 overflow-y-auto p-10 bg-zinc-950 text-white flex flex-col gap-8">
      
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2.5xl leading-tight text-white mb-1">
            Financial Intelligence
          </h2>
          <p className="text-sm font-sans text-zinc-500 leading-normal">
            Realtime metrics and comparative charts analyzing outflow velocities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend indicators */}
          <div className="flex items-center gap-4.5 bg-zinc-900 border border-zinc-850 rounded-2xl px-5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-3 h-0.75 bg-emerald-400 rounded" />
              <span>Current Month (May)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-3 h-0.75 bg-zinc-650 border border-t-[1.5px] border-dashed border-zinc-550 rounded" />
              <span>Previous Month (April)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Current Month absolute output */}
        <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col justify-between gap-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300 pointer-events-none" />
          <div className="flex items-start justify-between z-10">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 font-medium">Outflow Total (May)</span>
              <h3 className="text-3.5xl font-mono font-bold text-white tracking-tight mt-2">
                {formatCurrency(currentExpenses)}
              </h3>
            </div>
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400">
              <Lucide.TrendingUp className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 z-10 text-xs text-zinc-400 font-sans mt-2">
            <div className={`flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full ${
              overallPercentageChange <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {overallPercentageChange <= 0 ? '-' : '+'}
              {Math.abs(overallPercentageChange).toFixed(1)}%
            </div>
            <span>velocity compared to {formatCurrency(previousExpenses)} last month</span>
          </div>
        </div>

        {/* Operational Outflows (Rent Excluded) */}
        <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col justify-between gap-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300 pointer-events-none" />
          <div className="flex items-start justify-between z-10">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 font-medium leading-none">Operational Expenses</span>
              <h3 className="text-3.5xl font-mono font-bold text-indigo-300 tracking-tight mt-2">
                {formatCurrency(currentOperationalExpenses)}
              </h3>
            </div>
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-indigo-400">
              <Lucide.Sliders className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 z-10 text-xs text-zinc-400 font-sans mt-2">
            <div className={`flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full ${
              operationalPercentageChange <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {operationalPercentageChange <= 0 ? '-' : '+'}
              {Math.abs(operationalPercentageChange).toFixed(1)}%
            </div>
            <span>excluding luxury assets & rent bills ($1000+)</span>
          </div>
        </div>

        {/* Highlight Banner of Peak single element */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-900 rounded-3xl p-6.5 flex flex-col justify-between gap-5 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 font-mono text-[9px] uppercase tracking-wider text-emerald-400/40 font-semibold select-none leading-none">
            Anomalous Peak
          </div>
          <div className="z-10">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-medium">Single item outlier</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-emerald-500/10 rounded-2xl p-2.5 border border-emerald-500/15">
                <Lucide.Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="truncate max-w-[180px]">
                <h4 className="font-sans font-bold text-sm text-zinc-100 truncate">
                  {peakDayMostExpensiveItem ? peakDayMostExpensiveItem.description : 'No single record'}
                </h4>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  May {peakDay} · Category: {peakDayMostExpensiveItem ? peakDayMostExpensiveItem.category : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-baseline justify-between z-10 mt-2">
            <span className="text-xs text-zinc-400 font-sans">Outlier Cost</span>
            <span className="font-mono font-extrabold text-white text-xl">
              {peakDayMostExpensiveItem ? formatCurrency(peakDayMostExpensiveItem.amount) : '$0.00'}
            </span>
          </div>
        </div>

      </div>

      {/* Daily comparative SVG Chart Block */}
      <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-7 flex flex-col gap-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">Daily Cost Amplitude</h3>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Hover on days to compare. Spikes represent days of highest physical asset transfers.
            </p>
          </div>
          
          {/* Smart Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExcludeLargeBills(!excludeLargeBills)}
              title="Excluding rent and fixed utilities over $1000 lets users accurately match operational margins"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-sans text-xs font-semibold cursor-pointer transition-all ${
                excludeLargeBills
                  ? 'bg-zinc-950 border-emerald-400 text-emerald-400 shadow-sm shadow-emerald-500/5'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Lucide.EyeOff className="w-4 h-4" />
              <span>Exclude Large Fixed Bills ($1000+)</span>
            </button>
          </div>
        </div>

        {/* SVG Drawing Area */}
        <div className="relative w-full overflow-hidden select-none" style={{ height: `${height}px` }}>
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="mayAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingY + ratio * chartHeight;
              const value = (1 - ratio) * maxVal;
              return (
                <g key={index} className="opacity-15">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    fill="#ffffff"
                    className="font-mono text-[9px] font-medium"
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}

            {/* X Axis label coordinates */}
            {[1, 5, 10, 15, 20, 25, 30].map((day, index) => {
              const { x } = getCoordinates(day, 0);
              return (
                <text
                  key={index}
                  x={x}
                  y={height - paddingY + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  className="font-mono text-[9px] font-bold"
                >
                  D{day}
                </text>
              );
            })}

            {/* Previous Month (April) - Slate dotted/dashed line */}
            <path
              d={aprilPath}
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeDasharray="5 5"
              className="opacity-40"
            />

            {/* Current Month (May) Area under line */}
            <path
              d={mayAreaPath}
              className="transition-all duration-300"
              fill="url(#mayAreaGrad)"
            />

            {/* Current Month (May) - Emerald solid line */}
            <path
              d={mayPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]"
            />

            {/* Vertical grid line tracker where hovering */}
            {hoveredDay !== null && (
              <g>
                {/* Visual cursor guideline */}
                <line
                  x1={getCoordinates(hoveredDay, 0).x}
                  y1={paddingY}
                  x2={getCoordinates(hoveredDay, 0).x}
                  y2={height - paddingY}
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="opacity-70"
                />
                
                {/* May Hover Dot */}
                <circle
                  cx={getCoordinates(hoveredDay, mayDaily[hoveredDay]).x}
                  cy={getCoordinates(hoveredDay, mayDaily[hoveredDay]).y}
                  r="6"
                  fill="#10B981"
                  stroke="#121214"
                  strokeWidth="2.5"
                  className="filter drop-shadow-[0_0_6px_#10B981]"
                />

                {/* April Hover Dot */}
                <circle
                  cx={getCoordinates(hoveredDay, aprilDaily[hoveredDay]).x}
                  cy={getCoordinates(hoveredDay, aprilDaily[hoveredDay]).y}
                  r="4.5"
                  fill="#64748B"
                  stroke="#121214"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* Permanent Anomalous Peak Day Pointer (Answering User Constraint specifically) */}
            {peakDayVal > 0 && hoveredDay === null && (
              <g>
                <line
                  x1={getCoordinates(peakDay, 0).x}
                  y1={paddingY}
                  x2={getCoordinates(peakDay, 0).x}
                  y2={height - paddingY}
                  stroke="#EAB308"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  className="opacity-40"
                />
                {/* Glowing ring */}
                <circle
                  cx={getCoordinates(peakDay, peakDayVal).x}
                  cy={getCoordinates(peakDay, peakDayVal).y}
                  r="7.5"
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <circle
                  cx={getCoordinates(peakDay, peakDayVal).x}
                  cy={getCoordinates(peakDay, peakDayVal).y}
                  r="4"
                  fill="#EAB308"
                />
              </g>
            )}

            {/* Screen Hotspots for mouse interactions */}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const { x } = getCoordinates(day, 0);
              return (
                <rect
                  key={day}
                  x={x - (chartWidth / 60)}
                  y={paddingY}
                  width={chartWidth / 30}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              );
            })}
          </svg>
        </div>

        {/* Dynamic Comparison Panel (Points out day-in-particular or peak-in-particular) */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5.5 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          
          {hoveredDay !== null ? (
            /* HOVER PANEL ANALYTICS */
            <>
              <div className="flex items-center gap-3.5">
                <div className="bg-emerald-500/10 rounded-xl p-2.5 border border-emerald-500/20">
                  <Lucide.CalendarDays className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm text-zinc-100">Comparison: Day {hoveredDay}</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Compare exact same day interval</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400">May {hoveredDay}</span>
                  <div className="font-mono font-bold text-base mt-1 text-white">{formatCurrency(mayDaily[hoveredDay])}</div>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">April {hoveredDay}</span>
                  <div className="font-mono font-bold text-base mt-1 text-zinc-400">{formatCurrency(aprilDaily[hoveredDay])}</div>
                </div>
              </div>
            </>
          ) : (
            /* DEFAULT PEAK DAY HIGHLIGHT PANEL */
            <>
              <div className="flex items-center gap-3.5">
                <div className="bg-yellow-500/10 rounded-xl p-2.5 border border-yellow-500/20">
                  <Lucide.TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-zinc-100 text-sm">Peak Spending Day: May {peakDay}</h4>
                  {peakDayMostExpensiveItem ? (
                    <p className="text-xs text-zinc-400 font-sans mt-0.5">
                      Most spent item: <span className="text-yellow-400 font-medium">{peakDayMostExpensiveItem.description}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">No database logs registered</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-yellow-400 font-semibold leading-none">Peak Day Total</span>
                  <div className="font-mono font-bold text-lg mt-1 text-white">{formatCurrency(peakDayVal)}</div>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 leading-none">Prev Month (April {peakDay})</span>
                  <div className="font-mono font-bold text-lg mt-1 text-zinc-400">{formatCurrency(aprilDaily[peakDay])}</div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* Category Wise Distribution (Bento-Grid / Visual percentage breakdowns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Category lists representation */}
        <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 xl:col-span-2 flex flex-col gap-5">
          <div>
            <h3 className="font-display font-semibold text-base text-zinc-100">Category-Wise Distribution</h3>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">May budget segments and percentage fractions compared to last month.</p>
          </div>

          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {categoryBreakdown.map((cat) => {
              const LucideIcon = (Lucide as any)[cat.icon] || Lucide.HelpCircle;
              const velocityChange = getPercentageChange(cat.amount, cat.prevAmount);

              return (
                <div key={cat.id} className="flex items-center justify-between p-4.5 bg-zinc-950/65 border border-zinc-850/60 rounded-2xl">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="p-2.5 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <LucideIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between font-sans text-sm font-semibold text-zinc-200">
                        <span>{cat.name}</span>
                        <span className="font-mono text-zinc-300">{formatCurrency(cat.amount)}</span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: cat.color,
                            width: `${cat.percentageOfTotal}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col gap-1 flex-shrink-0 min-w-20 pl-2">
                    <span className="font-mono text-[10px] text-zinc-500 font-semibold">{cat.percentageOfTotal.toFixed(0)}% of total</span>
                    <span className={`font-mono text-[9px] font-bold ${
                      velocityChange <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {velocityChange <= 0 ? '↓' : '↑'} {Math.abs(velocityChange).toFixed(0)}% m/m
                    </span>
                  </div>
                </div>
              );
            })}
            
            {categoryBreakdown.length === 0 && (
              <div className="text-center py-10 text-zinc-500 font-sans text-sm">
                No outbound transactions logged for the select interval.
              </div>
            )}
          </div>
        </div>

        {/* Budget Health Warning Panel */}
        <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display font-semibold text-base text-zinc-100">Discretionary Analysis</h3>
            <p className="text-xs text-zinc-500 font-sans">
              Dynamic summary evaluating overall liquidity reserves and monthly velocities.
            </p>
          </div>

          <div className="bg-zinc-950 p-4.5 rounded-2xl border border-zinc-850 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-mono font-medium">
              <span className="text-zinc-400">MAY TOTAL CAPACITY</span>
              <span className="text-white font-bold">{formatCurrency(currentExpenses)}</span>
            </div>
            
            <div className="h-[1px] bg-zinc-850" />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-sans font-medium">
                <span>Active Core Reserves</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {formatCurrency(currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, current) => acc + current.amount, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 font-sans font-medium">
                <span>Remaining Net Savings</span>
                <span className="text-indigo-400 font-bold font-mono">
                  {formatCurrency(
                    currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, current) => acc + current.amount, 0) - currentExpenses
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick recommendation line */}
          <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/45 border border-zinc-850 rounded-2xl p-4 flex gap-3">
            <Lucide.Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white font-sans block mb-0.5">Sovereign Recommendation</span>
              Your operational expenditures are <span className="text-yellow-400 font-medium">stable</span>. Buying the <span className="text-indigo-300 font-mono font-medium">{peakDayMostExpensiveItem ? peakDayMostExpensiveItem.description : 'item'}</span> was the main spending driver.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
