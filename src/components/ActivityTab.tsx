import { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Transaction, Category, Account, AppSettings } from '../types';
import CategoryIcon from './CategoryIcon';

interface ActivityTabProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  settings: AppSettings;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onOpenAddExpense: () => void;
}

export default function ActivityTab({
  transactions,
  categories,
  accounts,
  settings,
  onEditTransaction,
  onDeleteTransaction,
  onOpenAddExpense,
}: ActivityTabProps) {
  const symbol = settings.currencySymbol || '$';

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<'all' | 'may' | 'apr'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Format currency helper
  const formatCurrency = (val: number) => {
    return `${symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;
  };

  // Human date parser
  const parseHumanDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) return 'Yesterday';

    // standard parse
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // 1. Text Search index
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toString().includes(searchTerm) ||
      (categories.find((c) => c.id === tx.category)?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // 2. Month Selector
    let matchesMonth = true;
    if (selectedMonth === 'may') {
      matchesMonth = tx.date.startsWith('2026-05');
    } else if (selectedMonth === 'apr') {
      matchesMonth = tx.date.startsWith('2026-04');
    }

    // 3. Account Selector
    const matchesAccount = selectedAccountId === 'all' || tx.accountId === selectedAccountId;

    // 4. Category Selector
    const matchesCategory = selectedCategoryId === 'all' || tx.category === selectedCategoryId;

    // 5. Transaction Type
    const matchesType = selectedType === 'all' || tx.type === selectedType;

    return matchesSearch && matchesMonth && matchesAccount && matchesCategory && matchesType;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    }
    if (sortBy === 'date-asc') {
      return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
    }
    if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    }
    if (sortBy === 'amount-asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  // Group by Date for cleaner presentation if sorted by Date
  const isDateSorted = sortBy === 'date-desc' || sortBy === 'date-asc';

  // Grouped structure: [ { date: 'YYYY-MM-DD', txs: [], totalExpense: X, totalIncome: Y } ]
  const groupedGroups: Array<{
    date: string;
    transactions: Transaction[];
    totalExpense: number;
    totalIncome: number;
  }> = [];

  if (isDateSorted) {
    sortedTransactions.forEach((tx) => {
      let group = groupedGroups.find((g) => g.date === tx.date);
      if (!group) {
        group = { date: tx.date, transactions: [], totalExpense: 0, totalIncome: 0 };
        groupedGroups.push(group);
      }
      group.transactions.push(tx);
      if (tx.type === 'expense') {
        group.totalExpense += tx.amount;
      } else {
        group.totalIncome += tx.amount;
      }
    });

    // Make sure ordering represents asc/desc
    if (sortBy === 'date-asc') {
      groupedGroups.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      groupedGroups.sort((a, b) => b.date.localeCompare(a.date));
    }
  }

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMonth('all');
    setSelectedAccountId('all');
    setSelectedCategoryId('all');
    setSelectedType('all');
    setSortBy('date-desc');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedMonth !== 'all' ||
    selectedAccountId !== 'all' ||
    selectedCategoryId !== 'all' ||
    selectedType !== 'all';

  return (
    <div id="activity-section" className="flex-1 overflow-y-auto p-10 bg-zinc-950 text-white flex flex-col gap-7 select-none">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2.5xl leading-tight text-white mb-1">
            Activity Ledger
          </h2>
          <p className="text-sm font-sans text-zinc-500 leading-normal">
            A comprehensive, traceable history of account expenditures and capital inflows.
          </p>
        </div>
        <button
          onClick={onOpenAddExpense}
          className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 px-5 py-3 rounded-xl font-sans font-semibold text-sm cursor-pointer transition flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Lucide.Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Filter and Command Deck */}
      <div className="bg-zinc-900/60 border border-zinc-900 rounded-3xl p-6 flex flex-col gap-5">
        
        {/* Search Input and Dynamic Clear */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Lucide.Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 pl-11 pr-10 text-white text-sm font-sans placeholder-zinc-550 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/25"
              placeholder="Filter by description (e.g. Chipotle, WholeFoods, Netflix) or amount..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Menu dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-zinc-500 text-xs font-medium font-sans whitespace-nowrap min-w-14">Sort By</span>
            <div className="relative flex-1 lg:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full lg:w-48 bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white text-sm font-semibold font-sans cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/25 appearance-none"
              >
                <option value="date-desc">Newest to Oldest</option>
                <option value="date-asc">Oldest to Newest</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <Lucide.SlidersHorizontal className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Filters Selectors Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 mt-1 border-t border-zinc-900 pt-5">
          
          {/* Month Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Calendar Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all">All Months</option>
              <option value="may">May 2026</option>
              <option value="apr">April 2026</option>
            </select>
          </div>

          {/* Account Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Account Source</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Segment Group</span>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector (Expense / Income) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Capital Outlay</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-850 text-white rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all font-semibold">All Outlays</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Incomes Only</option>
            </select>
          </div>

          {/* Clear Filters Call to Action */}
          <div className="flex items-end col-span-2 sm:col-span-1">
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="w-full bg-zinc-950/70 text-emerald-405 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-emerald-400"
              >
                <Lucide.RotateCcw className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <div className="w-full text-center text-zinc-600 font-mono text-[9px] uppercase font-bold tracking-widest py-3 leading-none pointer-events-none">
                FILTERS DEFAULTED
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Database Listing display */}
      <div className="flex-1">
        {sortedTransactions.length === 0 ? (
          /* Empty Database Notification */
          <div className="bg-zinc-900/15 border border-dashed border-zinc-900 rounded-3xl py-16 px-10 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-zinc-900/60 rounded-full border border-zinc-850 text-zinc-500">
              <Lucide.Database className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-zinc-200">No matching logs</h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                We couldn't locate any transaction entries. Try clearing filters or create a new entry.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 text-xs font-bold text-emerald-400 border border-emerald-400/20 bg-emerald-500/5 px-4.5 py-2.5 rounded-full hover:bg-emerald-500/10 cursor-pointer"
              >
                Clear Filtering States
              </button>
            )}
          </div>
        ) : isDateSorted ? (
          /* PRESENTATION 1: Chronological grouping by Date (Highly immersive layout from references) */
          <div className="flex flex-col gap-6.5">
            {groupedGroups.map((group) => (
              <div key={group.date} className="flex flex-col gap-3">
                
                {/* Visual day section header */}
                <div className="flex justify-between items-end border-b border-zinc-900 pb-1.5 px-4">
                  <span className="font-display font-semibold text-sm text-zinc-100">{parseHumanDate(group.date)}</span>
                  <div className="flex gap-4 font-mono text-[10px] font-bold">
                    {group.totalExpense > 0 && (
                      <span className="text-rose-400">- {formatCurrency(group.totalExpense)}</span>
                    )}
                    {group.totalIncome > 0 && (
                      <span className="text-emerald-400">+ {formatCurrency(group.totalIncome)}</span>
                    )}
                  </div>
                </div>

                {/* Individual transaction list entries */}
                <div className="flex flex-col gap-2">
                  {group.transactions.map((tx) => {
                    const catObj = categories.find((c) => c.id === tx.category);
                    const accObj = accounts.find((a) => a.id === tx.accountId);
                    
                    return (
                      <div
                        key={tx.id}
                        id={`tx-row-${tx.id}`}
                        className="bg-zinc-900/40 border border-zinc-900/80 hover:border-zinc-800 hover:bg-zinc-900/70 rounded-2xl p-4.5 flex items-center justify-between gap-5 transition duration-150 group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Standard category beautiful icon wrapper */}
                          <CategoryIcon
                            name={catObj?.icon || 'HelpCircle'}
                            color={catObj?.color || '#94A3B8'}
                            className="bg-zinc-950 flex-shrink-0"
                          />
                          <div className="truncate pr-4 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-semibold text-sm text-zinc-200 truncate">{tx.description}</span>
                              {accObj && (
                                <span
                                  className="font-mono text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: `${accObj.color}15`, color: accObj.color, border: `1px solid ${accObj.color}25` }}
                                >
                                  {accObj.name}
                                </span>
                              )}
                            </div>
                            <span className="font-sans text-xs text-zinc-500 mt-1.5 block">
                              {catObj?.name || 'Uncategorized'} · May {tx.date.split('-')[2]}
                            </span>
                          </div>
                        </div>

                        {/* Cost Sum metadata & floating operational action icons */}
                        <div className="flex items-center gap-4.5 text-right flex-shrink-0 select-none">
                          <span
                            className={`font-mono text-base font-bold select-none ${
                              tx.type === 'expense' ? 'text-rose-450 text-rose-450' : 'text-emerald-400 font-extrabold'
                            }`}
                            style={{ color: tx.type === 'expense' ? '#F43F5E' : '#10B981' }}
                          >
                            {tx.type === 'expense' ? '-' : '+'}
                            {formatCurrency(tx.amount)}
                          </span>

                          {/* Hover visible micro elements for Edit & Delete */}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              id={`btn-edit-${tx.id}`}
                              onClick={() => onEditTransaction(tx)}
                              className="p-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white cursor-pointer transition shadow-sm"
                              title="Edit Entry"
                            >
                              <Lucide.Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-${tx.id}`}
                              onClick={() => {
                                if (window.confirm('Secure verification requested. Are you sure you wish to delete this entry?')) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              className="p-2 bg-zinc-950 border border-zinc-850 hover:border-rose-900/35 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-400 cursor-pointer transition shadow-sm"
                              title="Delete Entry"
                            >
                              <Lucide.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* PRESENTATION 2: Simple Non-Date Sorted Listing grid row */
          <div className="flex flex-col gap-2">
            {sortedTransactions.map((tx) => {
              const catObj = categories.find((c) => c.id === tx.category);
              const accObj = accounts.find((a) => a.id === tx.accountId);
              
              return (
                <div
                  key={tx.id}
                  className="bg-zinc-900/40 border border-zinc-900/80 hover:border-zinc-800 hover:bg-zinc-900/70 rounded-2xl p-4 flex items-center justify-between gap-5 transition duration-150 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <CategoryIcon
                      name={catObj?.icon || 'HelpCircle'}
                      color={catObj?.color || '#94A3B8'}
                      className="bg-zinc-950"
                    />
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-sm text-zinc-200 truncate">{tx.description}</span>
                        {accObj && (
                          <span
                            className="font-mono text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${accObj.color}15`, color: accObj.color, border: `1px solid ${accObj.color}25` }}
                          >
                            {accObj.name}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 mt-1 flex gap-2">
                        <span>{catObj?.name || 'Uncategorized'}</span>
                        <span>·</span>
                        <span className="font-sans font-medium text-zinc-500 text-[10px]">{parseHumanDate(tx.date)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4.5 text-right flex-shrink-0 select-none">
                    <span
                      className={`font-mono text-base font-bold ${
                        tx.type === 'expense' ? 'text-rose-450' : 'text-emerald-400 font-extrabold'
                      }`}
                      style={{ color: tx.type === 'expense' ? '#F43F5E' : '#10B981' }}
                    >
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white cursor-pointer transition shadow-sm"
                        title="Edit Entry"
                      >
                        <Lucide.Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Secure verification request. Are you sure you wish to delete this entry?')) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-2 bg-zinc-950 border border-zinc-850 hover:border-rose-900/35 hover:bg-rose-500/10 rounded-xl text-zinc-400 hover:text-rose-400 cursor-pointer transition shadow-sm"
                        title="Delete Entry"
                      >
                        <Lucide.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
