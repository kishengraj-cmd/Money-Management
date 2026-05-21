import { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Budget, Category, Transaction, AppSettings } from '../types';

interface BudgetTabProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  settings: AppSettings;
  onUpdateBudget: (categoryId: string, amount: number) => Promise<void>;
}

export default function BudgetTab({
  budgets,
  categories,
  transactions,
  settings,
  onUpdateBudget,
}: BudgetTabProps) {
  const symbol = settings.currencySymbol || '$';
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState<string>('');

  // Only consider May expenses (current month)
  const mayTransactions = transactions.filter(t => t.date.startsWith('2026-05') && t.type === 'expense');

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `${symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;
  };

  // Compile active categories list including an 'all' (overall) category
  const budgetList = [
    { id: 'all', name: 'Overall Monthly Budget', icon: 'Sliders', color: '#10B981' },
    ...categories.filter(c => c.id !== 'salary'),
  ].map(cat => {
    // Find registered budget
    const budgetObj = budgets.find(b => b.categoryId === cat.id);
    const limit = budgetObj ? budgetObj.amount : 0;

    // Sum active expenses
    const spent = mayTransactions
      .filter(t => cat.id === 'all' || t.category === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const percent = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      ...cat,
      limit,
      spent,
      percent,
    };
  });

  const handleEditClick = (categoryId: string, currentLimit: number) => {
    setEditingCatId(categoryId);
    setEditBudgetAmount(String(currentLimit));
  };

  const handleSaveBudget = async (categoryId: string) => {
    const val = parseFloat(editBudgetAmount);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid cap amount.');
      return;
    }
    await onUpdateBudget(categoryId, val);
    setEditingCatId(null);
  };

  return (
    <div id="budget-section" className="flex-1 overflow-y-auto p-10 bg-zinc-950 text-white flex flex-col gap-8 select-none">
      
      {/* Title block */}
      <div>
        <h2 className="font-display font-bold text-2.5xl leading-tight text-white mb-1">
          Capital Thresholds & Budgets
        </h2>
        <p className="text-sm font-sans text-zinc-500 leading-normal">
          Establish limits over transactional segments to retain long-term net savings goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Render budgets list */}
        {budgetList.map((item) => {
          const LucideIcon = (Lucide as any)[item.icon] || Lucide.HelpCircle;
          const isEditing = editingCatId === item.id;
          
          // Compute visual progress bar coloring
          let barColor = 'bg-emerald-400';
          let ringBorder = 'border-emerald-500/20';
          let textColor = 'text-emerald-400';
          let bgTone = 'bg-emerald-500/5';

          if (item.percent >= 100) {
            barColor = 'bg-rose-500';
            ringBorder = 'border-rose-500/30';
            textColor = 'text-rose-400';
            bgTone = 'bg-rose-500/5';
          } else if (item.percent >= 85) {
            barColor = 'bg-amber-450';
            ringBorder = 'border-amber-500/30';
            textColor = 'text-amber-400';
            bgTone = 'bg-amber-500/5';
          }

          return (
            <div
              key={item.id}
              className={`border rounded-3xl p-6.5 flex flex-col justify-between gap-5 transition-all duration-150 ${
                item.id === 'all'
                  ? 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-emerald-500/15 ring-1 ring-emerald-500/10 col-span-1 lg:col-span-3'
                  : 'bg-zinc-900/60 border-zinc-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="p-3 bg-zinc-950 rounded-2xl border"
                    style={{ borderColor: `${item.color}25`, color: item.color }}
                  >
                    <LucideIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-zinc-100">{item.name}</h3>
                    <span className="font-mono text-[9px] text-zinc-500 font-semibold uppercase tracking-widest leading-none mt-1 block">
                      Segment Cap
                    </span>
                  </div>
                </div>

                {/* Cap Limit indicator */}
                <div className="text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-zinc-400">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={editBudgetAmount}
                        onChange={(e) => setEditBudgetAmount(e.target.value)}
                        className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-emerald-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveBudget(item.id)}
                        className="p-1 px-1.5 bg-emerald-400 text-zinc-950 rounded hover:bg-emerald-300 font-semibold text-xs cursor-pointer"
                        title="Save Changes"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-base text-zinc-200">
                        {item.limit > 0 ? formatCurrency(item.limit) : 'Uncapped'}
                      </span>
                      <button
                        onClick={() => handleEditClick(item.id, item.limit)}
                        className="text-zinc-500 hover:text-emerald-400 transition cursor-pointer"
                        title="Edit threshold limit"
                      >
                        <Lucide.Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and sum fractions */}
              <div className="flex flex-col gap-2.5 mt-2">
                <div className="flex justify-between items-baseline text-xs font-sans">
                  <span className="text-zinc-400">Consumed: <strong className="text-zinc-250 text-zinc-100 font-semibold">{formatCurrency(item.spent)}</strong></span>
                  {item.limit > 0 ? (
                    <span className={`font-mono font-semibold ${textColor}`}>
                      {item.percent.toFixed(0)}% Utilized
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-mono text-[10px] uppercase">Operational Safe State</span>
                  )}
                </div>

                {/* Custom Tailwind progress channel */}
                {item.limit > 0 && (
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                    <div
                      className={`h-full rounded-full transition-all duration-350 ${barColor}`}
                      style={{ width: `${Math.min(item.percent, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Warnings & Suggestions (Answering budget health contextually) */}
              {item.limit > 0 && (
                <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed flex items-start gap-2 ${bgTone} ${ringBorder}`}>
                  <Lucide.ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${textColor}`} />
                  <div className="text-zinc-300">
                    {item.percent >= 100 ? (
                      <>
                        <strong className="text-rose-450 block font-semibold mb-0.5" style={{ color: '#F43F5E' }}>Cap Exceeded</strong>
                        Segment has bypassed the configured threshold of {formatCurrency(item.limit)}. Restrict further operational acquisitions under this sector.
                      </>
                    ) : item.percent >= 85 ? (
                      <>
                        <strong className="text-amber-450 block font-semibold mb-0.5">Threshold Alert</strong>
                        Outflows are nearing budget thresholds. You have secondary reserves of {formatCurrency(item.limit - item.spent)} remaining before critical capacity.
                      </>
                    ) : (
                      <>
                        <strong className="text-emerald-450 block font-semibold mb-0.5" style={{ color: '#10B981' }}>Safe State Active</strong>
                        Segregation is fully healthy. You have a remaining portable buffer of {formatCurrency(item.limit - item.spent)} before limits are bypassed.
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}
