import { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Account, AppSettings } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accounts: Account[];
  settings: AppSettings;
  onOpenAddExpense: () => void;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  accounts,
  settings,
  onOpenAddExpense,
}: NavigationProps) {
  const symbol = settings.currencySymbol || '$';

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `${val < 0 ? '-' : ''}${symbol}${Math.abs(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const menuItems = [
    { id: 'activity', name: 'Activity Log', icon: Lucide.Activity },
    { id: 'summary', name: 'Analytics Summary', icon: Lucide.PieChart },
    { id: 'budget', name: 'Budgets & Limits', icon: Lucide.Sliders },
    { id: 'recurrent', name: 'Recurring Expenses', icon: Lucide.Repeat },
    { id: 'settings', name: 'System Settings', icon: Lucide.Settings },
  ];

  const totalBalance = accounts.reduce((acc, current) => acc + current.balance, 0);

  return (
    <aside id="desktop-sidebar" className="w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between h-screen sticky top-0 text-zinc-100 p-6 select-none self-stretch flex-shrink-0">
      <div className="flex flex-col gap-8">
        {/* Logo/Identity */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-xl p-2.5 shadow-lg shadow-emerald-500/15">
            <Lucide.Wallet className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-tight text-white">
              Sovereign Ledger
            </h1>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest leading-none mt-1">
              Personal Wealth
            </p>
          </div>
        </div>

        {/* Account Quick Balance Snippet */}
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-3">
          <span className="font-sans text-xs text-zinc-400 font-medium">Net Portable Capital</span>
          <div className="flex items-baseline justify-between">
            <span className={`font-display font-bold text-2xl tracking-tight ${totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(totalBalance)}
            </span>
            <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-750">
              SOLV
            </span>
          </div>

          <div className="h-[1px] bg-zinc-850 my-1" />

          {/* Individual account indicators */}
          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto no-scrollbar">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between text-xs font-sans text-zinc-300">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: acc.color }}
                  />
                  <span className="truncate max-w-[120px] font-medium text-zinc-400">{acc.name}</span>
                </div>
                <span className="font-mono font-semibold" style={{ color: acc.balance >= 0 ? '#10B981' : '#F43F5E' }}>
                  {formatCurrency(acc.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Desktop Navigation Options */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl transition-all duration-200 group font-sans text-sm text-left font-medium ${
                  isActive
                    ? 'bg-zinc-900 border border-zinc-800 text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Floating Add New Expense Quick Button */}
      <div className="flex flex-col gap-4">
        <button
          id="btn-sidebar-add"
          onClick={onOpenAddExpense}
          className="w-full bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-zinc-950 font-sans font-semibold text-sm py-4 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-400/20 active:translate-y-[1px]"
        >
          <Lucide.PlusCircle className="w-5 h-5" />
          <span>Log New Expense</span>
        </button>

        <div className="h-[1px] bg-zinc-900" />

        {/* System Credentials/Vibe */}
        <div className="flex items-center justify-between font-mono text-[10px] text-zinc-600 px-1">
          <span>DESKTOP OPTIMIZED</span>
          <span>v1.0.4</span>
        </div>
      </div>
    </aside>
  );
}
