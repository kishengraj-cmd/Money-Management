import { useState, useEffect, FormEvent } from 'react';
import * as Lucide from 'lucide-react';
import { Category, Account, Transaction } from '../types';

interface ExpenseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  editTransaction?: Transaction | null; // Optional edit mode
  onUpdate?: (id: string, tx: Partial<Transaction>) => Promise<void>;
}

export default function ExpenseEntryModal({
  isOpen,
  onClose,
  categories,
  accounts,
  currencySymbol,
  onSave,
  editTransaction,
  onUpdate,
}: ExpenseEntryModalProps) {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState<string>('');
  const [useKeypad, setUseKeypad] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize state on mount or editTransaction change
  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setActiveType(editTransaction.type);
        setAmount(String(editTransaction.amount));
        setSelectedCategory(editTransaction.category);
        setSelectedAccount(editTransaction.accountId);
        setTransactionDate(editTransaction.date);
        setDescription(editTransaction.description);
        setUseKeypad(false); // Default to standard keyboard input for edits
      } else {
        setActiveType('expense');
        setAmount('0');
        // Default to first expense categories/accounts
        const firstExpenseCategory = categories.find(c => c.id !== 'salary')?.id || categories[0]?.id || '';
        setSelectedCategory(firstExpenseCategory);
        setSelectedAccount(accounts[0]?.id || '');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setUseKeypad(true); // Default to keypad for fast clicks on new transactions
      }
      setErrorMsg('');
    }
  }, [isOpen, editTransaction, categories, accounts]);

  // Adjust selected category if transaction type switches
  useEffect(() => {
    if (!editTransaction) {
      if (activeType === 'income') {
        setSelectedCategory('salary');
      } else {
        const firstExpenseCategory = categories.find(c => c.id !== 'salary')?.id || categories[0]?.id || '';
        setSelectedCategory(firstExpenseCategory);
      }
    }
  }, [activeType]);

  if (!isOpen) return null;

  // Numerical keypad handlers
  const handleKeypadPress = (key: string) => {
    setErrorMsg('');
    if (key === 'C') {
      setAmount('0');
      return;
    }
    if (key === '⌫') {
      if (amount.length <= 1) {
        setAmount('0');
      } else {
        setAmount(amount.slice(0, -1));
      }
      return;
    }
    if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + '.');
      }
      return;
    }
    // Prevent starting with multiple zeros
    if (amount === '0') {
      if (key !== '0') setAmount(key);
    } else {
      // Limit decimal places to 2
      const decimalIdx = amount.indexOf('.');
      if (decimalIdx !== -1 && amount.length - decimalIdx > 2) {
        return; // Already has 2 decimals, ignore
      }
      setAmount(amount + key);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedCategory) {
      setErrorMsg('Please select a category.');
      return;
    }

    if (!selectedAccount) {
      setErrorMsg('Please select an account source.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter a transaction description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        amount: numericAmount,
        type: activeType,
        category: selectedCategory,
        accountId: selectedAccount,
        date: transactionDate,
        description: description.trim(),
      };

      if (editTransaction && onUpdate) {
        await onUpdate(editTransaction.id, payload);
      } else {
        await onSave(payload);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Server submittal failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Parameters Form */}
        <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-900">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lucide.PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-semibold text-xl text-white">
                  {editTransaction ? 'Modify Transaction' : 'Log Entry'}
                </h3>
              </div>
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-850">
                SYSTEM SECTOR
              </span>
            </div>

            {/* Selector: Expense / Income */}
            <div className="grid grid-cols-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-850">
              <button
                type="button"
                onClick={() => setActiveType('expense')}
                className={`py-2 rounded-lg font-sans text-sm font-semibold transition-all cursor-pointer ${
                  activeType === 'expense'
                    ? 'bg-zinc-800 text-white shadow-md shadow-black/10'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setActiveType('income')}
                className={`py-2 rounded-lg font-sans text-sm font-semibold transition-all cursor-pointer ${
                  activeType === 'income'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Income
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
                <Lucide.AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Amount & Description Inputs */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Manual Amount Input if Keypad is disabled */}
              {!useKeypad && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-medium">Tx Amount ({currencySymbol})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-base">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-base focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Description Tag */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Description / Details</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Lucide.FileText className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white font-sans text-sm focus:outline-none focus:border-emerald-400 placeholder-zinc-600"
                    placeholder="e.g. Starbucks Cafe Latte, Zara shirt..."
                  />
                </div>
              </div>

              {/* Account Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Source / Destination Account</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {accounts.map((acc) => (
                    <button
                      type="button"
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`py-3.5 px-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                        selectedAccount === acc.id
                          ? 'bg-zinc-900 border-emerald-400 text-white'
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 leading-none">Account</span>
                      <span className="text-xs font-semibold font-sans truncate text-zinc-200 mt-1">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium font-sans">Transaction Date</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Lucide.Calendar className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="date"
                    required
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white font-sans text-sm focus:outline-none focus:border-emerald-400 cursor-pointer scheme-dark"
                  />
                </div>
              </div>

            </form>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 border border-zinc-850 hover:bg-zinc-900 rounded-xl text-zinc-400 font-semibold py-3 text-sm cursor-pointer transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold py-3 rounded-xl text-sm cursor-pointer transition duration-200 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Lucide.Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Lucide.Check className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                  <span>{editTransaction ? 'Update Entry' : 'Post Transaction'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Virtual Display + Keypad or Categories */}
        <div className="w-full md:w-104 bg-zinc-900/35 p-8 flex flex-col gap-6 justify-between select-none max-h-[90vh] overflow-y-auto border-t md:border-t-0 border-zinc-900">
          
          {/* Virtual Display Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-end min-h-24 font-mono select-none">
            <div className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase leading-none mb-1">
              {activeType === 'expense' ? 'OUTFLOW SUM' : 'INFLOW SUM'}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 text-2xl font-semibold">{currencySymbol}</span>
              <span className="text-white text-3.5xl font-mono font-bold tracking-tight">
                {parseFloat(amount).toLocaleString(undefined, {
                  minimumFractionDigits: amount.includes('.') ? (amount.split('.')[1]?.length || 0) : 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Keypad VS Category List Selector Tabs */}
          <div className="grid grid-cols-2 bg-zinc-950/50 p-1 rounded-lg border border-zinc-900">
            <button
              onClick={() => setUseKeypad(true)}
              className={`py-1.5 rounded text-xs font-sans font-medium cursor-pointer transition ${
                useKeypad ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              Numeric Keypad
            </button>
            <button
              onClick={() => setUseKeypad(false)}
              className={`py-1.5 rounded text-xs font-sans font-medium cursor-pointer transition ${
                !useKeypad ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              Choose Category ({categories.filter(c => activeType === 'income' ? c.id === 'salary' : c.id !== 'salary').length})
            </button>
          </div>

          {/* Content Panel */}
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            {useKeypad ? (
              /* Virtual Keypad Grid */
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="aspect-square bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-850 rounded-xl text-center text-lg font-mono font-bold text-zinc-200 cursor-pointer transition flex items-center justify-center shadow-sm"
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('C')}
                  className="col-span-3 py-3 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-850 border border-zinc-850 rounded-xl text-center text-xs font-mono font-bold text-rose-400 uppercase tracking-widest cursor-pointer transition mt-1"
                >
                  Clear Entry Buffer
                </button>
              </div>
            ) : (
              /* Categories Grid Selection */
              <div className="grid grid-cols-3 gap-2.5 overflow-y-auto max-h-[350px] pr-1.5 no-scrollbar">
                {categories
                  .filter((cat) => {
                    // If income, filter items. Salary is standard. If expense, omit salary.
                    if (activeType === 'income') {
                      return cat.id === 'salary';
                    }
                    return cat.id !== 'salary';
                  })
                  .map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const LucideIcon = (Lucide as any)[cat.icon] || Lucide.HelpCircle;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`py-4.5 px-2 rounded-xl text-center flex flex-col items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-zinc-950 border-emerald-400 text-white shadow-xl scale-[1.02]'
                            : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: isSelected ? `${cat.color}2F` : `${cat.color}14`,
                            color: cat.color,
                          }}
                        >
                          <LucideIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-sans font-medium leading-none truncate max-w-full text-zinc-300 mt-1">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-center text-zinc-650 leading-normal">
            Physical keyboards are enabled as back-ups.<br />
            Secure local hashing active.
          </div>

        </div>

      </div>
    </div>
  );
}
