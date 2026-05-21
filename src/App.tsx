import { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';

import Navigation from './components/Navigation';
import ExpenseEntryModal from './components/ExpenseEntryModal';
import ActivityTab from './components/ActivityTab';
import SummaryTab from './components/SummaryTab';
import BudgetTab from './components/BudgetTab';
import RecurrentTab from './components/RecurrentTab';
import SettingsTab from './components/SettingsTab';

import {
  fetchAppData,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  saveBudget,
  createRecurrent,
  deleteRecurrent,
  toggleRecurrent,
  saveSettings,
  createAccount,
  deleteAccount,
  resetDatabase,
  AppData
} from './lib/api';

import { Transaction, Category, Account, Budget, RecurrentExpense, AppSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('summary'); // Default to summary overview for beautiful presentation on reload
  const [data, setData] = useState<AppData | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [editTransactionTarget, setEditTransactionTarget] = useState<Transaction | null>(null);
  const [errorHeader, setErrorHeader] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadAllData = async (showPulse = false) => {
    try {
      if (showPulse) setLoading(true);
      const appState = await fetchAppData();
      setData(appState);
      setErrorHeader('');
    } catch (err: any) {
      setErrorHeader('Could not speak with Sovereign Backend server. Retrying connection...');
      console.error('API Error:', err);
    } finally {
      if (showPulse) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(true);
  }, []);

  // Expense Handlers
  const handleSaveTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    await createTransaction(tx);
    await loadAllData(false); // Silent reload
  };

  const handleUpdateTransaction = async (id: string, tx: Partial<Transaction>) => {
    await updateTransaction(id, tx);
    setEditTransactionTarget(null);
    await loadAllData(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    await loadAllData(false);
  };

  // Budget Handlers
  const handleUpdateBudget = async (categoryId: string, amount: number) => {
    await saveBudget(categoryId, amount);
    await loadAllData(false);
  };

  // Recurrent Handlers
  const handleCreateRecurrent = async (recurrent: Omit<RecurrentExpense, 'id' | 'active'>) => {
    await createRecurrent(recurrent);
    await loadAllData(false);
  };

  const handleDeleteRecurrent = async (id: string) => {
    await deleteRecurrent(id);
    await loadAllData(false);
  };

  const handleToggleRecurrent = async (id: string) => {
    await toggleRecurrent(id);
    await loadAllData(false);
  };

  // Settings Handlers
  const handleSaveSettings = async (settingsPayload: Partial<AppSettings>) => {
    await saveSettings(settingsPayload);
    await loadAllData(false);
  };

  // Accounts Handlers
  const handleCreateAccount = async (newAcc: Omit<Account, 'id'>) => {
    await createAccount(newAcc);
    await loadAllData(false);
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    await loadAllData(false);
  };

  // Database System Purge
  const handleResetDatabase = async () => {
    await resetDatabase();
    await loadAllData(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditTransactionTarget(tx);
    setIsAddExpenseOpen(true);
  };

  const handleCloseEntryModal = () => {
    setIsAddExpenseOpen(false);
    setEditTransactionTarget(null);
  };

  // Display absolute load screen if no data exists yet
  if (loading || !data) {
    return (
      <div className="w-screen h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-2xl p-2.5 animate-bounce">
            <Lucide.Wallet className="w-6 h-6 text-zinc-950" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Sovereign Ledger</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Lucide.Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Booting ledger memories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-105 selection:bg-emerald-402 selection:text-zinc-952 flex flex-row items-stretch select-none relative">
      
      {/* Visual Error Header Banner if server crashes */}
      {errorHeader && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-500 border-b border-rose-600 text-zinc-950 text-center py-2 text-xs font-mono font-bold tracking-wide flex items-center justify-center gap-2">
          <Lucide.AlertOctagon className="w-4 h-4 fill-current animate-pulse" />
          <span>{errorHeader}</span>
          <button
            onClick={() => loadAllData(true)}
            className="underline underline-offset-2 ml-4 hover:text-white cursor-pointer"
          >
            Reconnect Protocols
          </button>
        </div>
      )}

      {/* Persistent Left Desktop Sidebar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accounts={data.accounts}
        settings={data.settings}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* Main Right Scroll Grid Screen */}
      <main id="primary-desktop-hull" className="flex-1 flex flex-col min-h-screen overflow-hidden bg-zinc-950">
        
        {/* Dynamic Section selector */}
        {activeTab === 'summary' && (
          <SummaryTab
            transactions={data.transactions}
            categories={data.categories}
            settings={data.settings}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTab
            transactions={data.transactions}
            categories={data.categories}
            accounts={data.accounts}
            settings={data.settings}
            onEditTransaction={handleOpenEdit}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            budgets={data.budgets}
            categories={data.categories}
            transactions={data.transactions}
            settings={data.settings}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === 'recurrent' && (
          <RecurrentTab
            recurrent={data.recurrent}
            categories={data.categories}
            accounts={data.accounts}
            settings={data.settings}
            onCreateRecurrent={handleCreateRecurrent}
            onDeleteRecurrent={handleDeleteRecurrent}
            onToggleRecurrent={handleToggleRecurrent}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={data.settings}
            accounts={data.accounts}
            onSaveSettings={handleSaveSettings}
            onCreateAccount={handleCreateAccount}
            onDeleteAccount={handleDeleteAccount}
            onResetDatabase={handleResetDatabase}
          />
        )}

      </main>

      {/* Dedicated Overlay Dial Dialog (Amount Keypads, accounts, categories) */}
      <ExpenseEntryModal
        isOpen={isAddExpenseOpen}
        onClose={handleCloseEntryModal}
        categories={data.categories}
        accounts={data.accounts}
        currencySymbol={data.settings.currencySymbol}
        onSave={handleSaveTransaction}
        editTransaction={editTransactionTarget}
        onUpdate={handleUpdateTransaction}
      />

      {/* Ambient background glow dots (Subtle, highly elegant aesthetic) */}
      <div className="absolute top-0 right-0 w-120 h-120 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-80 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

    </div>
  );
}
