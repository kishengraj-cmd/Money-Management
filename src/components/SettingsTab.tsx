import { useState, FormEvent } from 'react';
import * as Lucide from 'lucide-react';
import { AppSettings, Account } from '../types';

interface SettingsTabProps {
  settings: AppSettings;
  accounts: Account[];
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  onCreateAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export default function SettingsTab({
  settings,
  accounts,
  onSaveSettings,
  onCreateAccount,
  onDeleteAccount,
  onResetDatabase,
}: SettingsTabProps) {
  // Account Form Buffer
  const [accountName, setAccountName] = useState<string>('');
  const [accountBalance, setAccountBalance] = useState<string>('');
  const [accountColor, setAccountColor] = useState<string>('#3B82F6');
  const [isSubmittingAccount, setIsSubmittingAccount] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Currency Presets
  const currencies = [
    { code: 'USD', symbol: '$', name: 'United States Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro Union' },
    { code: 'GBP', symbol: '£', name: 'British Sterling Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const colors = [
    { class: '#3B82F6', label: 'Blue' },
    { class: '#10B981', label: 'Emerald' },
    { class: '#F59E0B', label: 'Amber' },
    { class: '#EF4444', label: 'Red' },
    { class: '#8B5CF6', label: 'Purple' },
    { class: '#EC4899', label: 'Pink' },
    { class: '#F97316', label: 'Orange' },
    { class: '#64748B', label: 'Slate' },
  ];

  const handleCurrencyChange = async (code: string) => {
    const selected = currencies.find(c => c.code === code);
    if (selected) {
      await onSaveSettings({
        currency: selected.code,
        currencySymbol: selected.symbol,
      });
    }
  };

  const handleCreateAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    const bal = parseFloat(accountBalance) || 0;

    try {
      setIsSubmittingAccount(true);
      await onCreateAccount({
        name: accountName.trim(),
        balance: bal,
        color: accountColor,
      });
      setAccountName('');
      setAccountBalance('');
    } catch (err) {
      alert('Failed to manifest net checking account.');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleResetClick = async () => {
    if (window.confirm('WARNING: Secure purge request. Are you sure you wish to completely wipe the ledger database and re-seed original sandbox transactions?')) {
      try {
        setIsResetting(true);
        await onResetDatabase();
      } catch (err) {
        alert('Purple error on sandbox purging.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div id="settings-section" className="flex-1 overflow-y-auto p-10 bg-zinc-950 text-white flex flex-col gap-8 select-none">
      
      {/* Title block */}
      <div>
        <h2 className="font-display font-bold text-2.5xl leading-tight text-white mb-1">
          System Protocols & Accounts
        </h2>
        <p className="text-sm font-sans text-zinc-500 leading-normal">
          Customize currency symbols, manage capital deposits, and perform ledger purges.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Container: General Settings & Purges */}
        <div className="flex flex-col gap-6">
          
          {/* Currency Configuration Panel */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col gap-5">
            <h3 className="font-sans font-bold text-sm text-zinc-350 flex items-center gap-2">
              <Lucide.Coins className="w-5 h-4.5 text-emerald-400" />
              <span>International Ledger Denominations</span>
            </h3>

            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              Updating your base denomination shifts currency symbols displayed in active summary calculations, budgets, and logs.
            </p>

            <div className="flex flex-col gap-2">
              {currencies.map((curr) => {
                const isSelected = settings.currency === curr.code;
                return (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    className={`flex items-center justify-between p-4.5 rounded-2xl border transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 border-emerald-500/20 text-white'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 font-sans text-sm">
                      <span className="font-mono text-base font-bold text-emerald-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850">
                        {curr.symbol}
                      </span>
                      <div>
                        <span className="font-semibold block text-zinc-150 leading-none">{curr.code}</span>
                        <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold block mt-1.5">{curr.name}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-sans font-bold">
                        <Lucide.Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Active Protocol</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sandbox Purges and seeds */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col gap-4">
            <h3 className="font-sans font-bold text-sm text-rose-400 flex items-center gap-2">
              <Lucide.Skull className="w-5 h-4.5 text-rose-400" />
              <span>Dangerous Operations Domain</span>
            </h3>
            
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              Resetting ledger databases purges all added custom expenses, accounts, and budgets, reseed original sandbox transactions (May/April 2026 logs) for pristine demos.
            </p>

            <button
              id="btn-settings-reset"
              onClick={handleResetClick}
              disabled={isResetting}
              className="w-full bg-rose-500/10 hover:bg-rose-550/20 text-rose-405 border border-rose-900/35 hover:bg-rose-500/15 py-3.5 px-4.5 rounded-xl text-xs font-bold text-rose-400 tracking-wider font-mono cursor-pointer transition flex items-center justify-center gap-2"
            >
              {isResetting ? (
                <>
                  <Lucide.Loader2 className="w-4 h-4 animate-spin" />
                  <span>Purging databases...</span>
                </>
              ) : (
                <>
                  <Lucide.RefreshCcw className="w-4 h-4" />
                  <span>RESET & SEED SANDBOX DATABASE</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Container: Accounts List & Create Form */}
        <div className="flex flex-col gap-6">
          
          {/* Create Account Form */}
          <form onSubmit={handleCreateAccount} className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col gap-5">
            <h3 className="font-sans font-bold text-sm text-zinc-350 flex items-center gap-2">
              <Lucide.PlusCircle className="w-5 h-4.5 text-emerald-400" />
              <span>Manifest Portable Outflow Source</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Account Name</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Robinhood Crypto, Chase Premium checking..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white font-sans text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Starting Balance ({settings.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-4 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Simple grid of visual select colors */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400">Ledger Index Ring Color</label>
                <div className="grid grid-cols-4 gap-2.5">
                  {colors.map((col) => {
                    const isSelected = accountColor === col.class;
                    return (
                      <button
                        type="button"
                        key={col.class}
                        onClick={() => setAccountColor(col.class)}
                        className={`w-full aspect-square rounded-lg border transition ${
                          isSelected ? 'border-white scale-105 shadow-md' : 'border-zinc-850'
                        }`}
                        style={{ backgroundColor: col.class }}
                        title={col.label}
                      />
                    );
                  })}
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={isSubmittingAccount}
              className="mt-1 w-full bg-emerald-400 hover:bg-emerald-350 text-zinc-950 font-sans font-bold py-3 px-4 rounded-xl text-center text-sm cursor-pointer transition shadow"
            >
              {isSubmittingAccount ? 'Manifesting...' : 'Provision New Spot Asset'}
            </button>
          </form>

          {/* Accounts display & inline deletion */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6.5 flex flex-col gap-4">
            <h3 className="font-sans font-bold text-sm text-zinc-350">Enrolled Capital Reserves ({accounts.length})</h3>
            
            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {accounts.map((acc) => {
                const isSpecial = ['bank', 'cash', 'credit'].includes(acc.id);
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-4.5 bg-zinc-950/65 border border-zinc-850 rounded-2xl"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.color }} />
                      <div>
                        <h4 className="font-sans font-bold text-sm text-zinc-200">{acc.name}</h4>
                        <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5 block font-semibold">
                          INDEX {acc.id.toUpperCase().substring(0, 8)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4.5 font-mono text-sm">
                      <span className="font-bold text-zinc-300" style={{ color: acc.balance >= 0 ? '#10B981' : '#F43F5E' }}>
                        {acc.balance >= 0 ? '' : '-'}{settings.currencySymbol}{Math.abs(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      
                      {!isSpecial ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`Wish to unenroll checking account: ${acc.name}?`)) {
                              onDeleteAccount(acc.id);
                            }
                          }}
                          className="p-1 px-2 border border-zinc-850 hover:bg-rose-500/10 hover:border-rose-950 hover:text-rose-400 text-zinc-500 rounded transition cursor-pointer"
                          title="Delete Account"
                        >
                          <Lucide.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-7 h-7 flex items-center justify-center p-1 cursor-not-allowed text-zinc-650" title="System Seed Accounts are permanent">
                          <Lucide.Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
