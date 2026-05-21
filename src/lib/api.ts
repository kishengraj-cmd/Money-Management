/**
 * Helper client to speak with our Express server-side database.
 */
import { Transaction, Budget, RecurrentExpense, AppSettings, Category, Account } from '../types';

export interface AppData {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  recurrent: RecurrentExpense[];
  settings: AppSettings;
}

export async function fetchAppData(): Promise<AppData> {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error('Failed to fetch application state');
  return res.json();
}

export async function createTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
}

export async function updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error('Failed to update transaction');
  return res.json();
}

export async function deleteTransaction(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  return res.json();
}

export async function saveBudget(categoryId: string, amount: number): Promise<{ success: boolean; budgets: Budget[] }> {
  const res = await fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, amount }),
  });
  if (!res.ok) throw new Error('Failed to save budget limit');
  return res.json();
}

export async function createRecurrent(recurrent: Omit<RecurrentExpense, 'id' | 'active'>): Promise<RecurrentExpense> {
  const res = await fetch('/api/recurrent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recurrent),
  });
  if (!res.ok) throw new Error('Failed to create recurrent transaction');
  return res.json();
}

export async function deleteRecurrent(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/recurrent/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete recurrent item');
  return res.json();
}

export async function toggleRecurrent(id: string): Promise<RecurrentExpense> {
  const res = await fetch(`/api/recurrent/${id}/toggle`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle recurrent active state');
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function createAccount(account: Omit<Account, 'id'>): Promise<Account> {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function deleteAccount(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset and seed database');
  return res.json();
}
