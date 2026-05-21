import { useState, FormEvent } from 'react';
import * as Lucide from 'lucide-react';
import { RecurrentExpense, Category, Account, AppSettings } from '../types';
import CategoryIcon from './CategoryIcon';

interface RecurrentTabProps {
  recurrent: RecurrentExpense[];
  categories: Category[];
  accounts: Account[];
  settings: AppSettings;
  onCreateRecurrent: (recurrent: Omit<RecurrentExpense, 'id' | 'active'>) => Promise<void>;
  onDeleteRecurrent: (id: string) => Promise<void>;
  onToggleRecurrent: (id: string) => Promise<void>;
}

export default function RecurrentTab({
  recurrent,
  categories,
  accounts,
  settings,
  onCreateRecurrent,
  onDeleteRecurrent,
  onToggleRecurrent,
}: RecurrentTabProps) {
  const symbol = settings.currencySymbol || '$';

  // State to register new ongoing bills
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories.find(c => c.id !== 'salary')?.id || categories[0]?.id || '');
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'annually'>('monthly');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `${symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedVal = parseFloat(amount);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      setErrorMsg('Please specify a valid numeric amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please specify a description for the ongoing item.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateRecurrent({
        amount: parsedVal,
        categoryId: selectedCategory,
        accountId: selectedAccount,
        description: description.trim(),
        frequency,
        startDate,
      });

      // Clear input buffers
      setAmount('');
      setDescription('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg('Failed to persist ongoing model. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="recurrent-section" className="flex-1 overflow-y-auto p-10 bg-zinc-950 text-white flex flex-col xl:flex-row gap-10 select-none">
      
      {/* Left Input Box: Form entry */}
      <div className="flex-1 max-w-xl">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display font-bold text-2.5xl leading-tight text-white mb-1">
              Recurring Outlays
            </h2>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              Register recurring operational costs (subscriptions, housing, utilities) to automate future budget forecasts.
            </p>
          </div>

          <form onSubmit={handleCreate} className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col gap-5">
            <h3 className="font-sans font-bold text-sm text-zinc-350 flex items-center gap-2">
              <Lucide.PlusCircle className="w-5 h-4.5 text-emerald-400 stroke-[2]" />
              <span>Provision Recurring Schedule</span>
            </h3>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/15 text-rose-400 p-3.5 rounded-xl text-xs font-sans">
                {errorMsg}
              </div>
            )}

            {/* Sum Outlay amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Regular Outflow Sum ({symbol})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-550 font-mono text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            {/* Note tag */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Recurring Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Netflix Premium, Spotify, Gym membership..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white font-sans text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder-zinc-600"
              />
            </div>

            {/* Dual Grid: Category & Account */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Category Selection</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {categories.filter(c => c.id !== 'salary').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Account Source</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Dual Grid: Frequency & Start Date */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Frequency Interval</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="daily">Daily Schedule</option>
                  <option value="weekly">Weekly Schedule</option>
                  <option value="monthly">Monthly Schedule</option>
                  <option value="annually">Annually Schedule</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Trigger Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-4 text-white font-sans text-xs focus:outline-none focus:border-emerald-400 cursor-pointer scheme-dark"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-emerald-400 hover:bg-emerald-350 active:bg-emerald-500 text-zinc-950 font-sans font-bold py-3 px-4 rounded-xl text-center text-sm cursor-pointer transition shadow shadow-emerald-400/5 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Lucide.Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <Lucide.CalendarClock className="w-4.5 h-4.5" />
                  <span>Enroll Scheduled Outflow</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right List Box: Active Enrollments */}
      <div className="flex-1">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-zinc-150">Active Registrations</h3>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Automated entries currently enrolled in database memory.</p>
          </div>

          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
            {recurrent.map((item) => {
              const catObj = categories.find((c) => c.id === item.categoryId);
              const accObj = accounts.find((a) => a.id === item.accountId);

              return (
                <div
                  key={item.id}
                  className={`bg-zinc-900/60 border rounded-2xl p-4.5 flex items-center justify-between gap-5 transition duration-150 ${
                    item.active ? 'border-zinc-850' : 'border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4.5 flex-1 min-w-0">
                    <CategoryIcon
                      name={catObj?.icon || 'HelpCircle'}
                      color={catObj?.color || '#64748B'}
                      className="bg-zinc-950"
                    />
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-sm text-zinc-200 truncate">{item.description}</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold bg-zinc-950 border border-zinc-850 px-2.5 py-0.5 rounded-full text-zinc-400">
                          {item.frequency}
                        </span>
                      </div>
                      <span className="font-sans text-xs text-zinc-500 mt-1 block">
                        Source Account: <span className="text-zinc-400 font-medium">{accObj?.name || 'Cash'}</span> · Starts {item.startDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4 flex-shrink-0 select-none">
                    <div>
                      <span className="font-mono text-base font-bold text-white block">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    {/* Actions: Toggle and Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleRecurrent(item.id)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          item.active
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-955 border-zinc-800 text-zinc-500 hover:text-zinc-350'
                        }`}
                        title={item.active ? 'Pause Registration' : 'Resume Registration'}
                      >
                        <Lucide.Power className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Secure verification request. Wish to unenroll this recurring cost?')) {
                            onDeleteRecurrent(item.id);
                          }
                        }}
                        className="p-2 bg-zinc-950 border border-zinc-850 hover:border-rose-900/40 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-450 cursor-pointer transition shadow-sm"
                        title="Unenroll Item"
                      >
                        <Lucide.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}

            {recurrent.length === 0 && (
              <div className="bg-zinc-900/10 border border-dashed border-zinc-900 rounded-3xl py-12 px-7 text-center">
                <p className="text-xs text-zinc-500 font-sans">No scheduled outlays enrolled. Set up subscriptions on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
