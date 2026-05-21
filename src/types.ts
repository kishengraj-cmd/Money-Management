export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex or tailwind color class
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string; // Category ID
  accountId: string; // Account ID
  date: string; // YYYY-MM-DD
  description: string;
  createdAt: string;
}

export interface Budget {
  categoryId: string; // category ID or 'all' for overall budget
  amount: number;
  period: 'monthly';
}

export interface RecurrentExpense {
  id: string;
  amount: number;
  categoryId: string;
  accountId: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'annually';
  startDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface AppSettings {
  currency: string; // 'USD' | 'EUR' | 'INR' | 'GBP' etc.
  currencySymbol: string;
  darkTheme: boolean;
}
