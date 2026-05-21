import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Express setup
const app = express();
const PORT = 3000;

app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'db.json');

// Interface definition matching database structure
interface Schema {
  categories: Array<{ id: string; name: string; icon: string; color: string }>;
  accounts: Array<{ id: string; name: string; balance: number; color: string }>;
  transactions: Array<{
    id: string;
    amount: number;
    type: 'expense' | 'income';
    category: string;
    accountId: string;
    date: string;
    description: string;
    createdAt: string;
  }>;
  budgets: Array<{ categoryId: string; amount: number; period: 'monthly' }>;
  recurrent: Array<{
    id: string;
    amount: number;
    categoryId: string;
    accountId: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'annually';
    startDate: string;
    active: boolean;
  }>;
  settings: {
    currency: string;
    currencySymbol: string;
    darkTheme: boolean;
  };
}

const defaultCategories = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B' }, // Amber
  { id: 'fuel', name: 'Fuel & Transport', icon: 'Fuel', color: '#06B6D4' }, // Cyan
  { id: 'games', name: 'Games & Tech', icon: 'Gamepad2', color: '#8B5CF6' }, // Purple
  { id: 'pharmacy', name: 'Pharmacy & Health', icon: 'Pill', color: '#EF4444' }, // Red
  { id: 'shopping', name: 'Shopping & Apparel', icon: 'ShoppingBag', color: '#EC4899' }, // Pink
  { id: 'utilities', name: 'Bills & Utilities', icon: 'Lightbulb', color: '#6366F1' }, // Indigo
  { id: 'rent', name: 'Rent & Housing', icon: 'Home', color: '#64748B' }, // Slate
  { id: 'entertainment', name: 'Entertainment & Leisure', icon: 'Film', color: '#F43F5E' }, // Rose
  { id: 'salary', name: 'Salary & Income', icon: 'Wallet', color: '#10B981' }, // Emerald
];

const defaultAccounts = [
  { id: 'bank', name: 'Chase Checking', balance: 4820.00, color: '#3B82F6' }, // Blue
  { id: 'credit', name: 'Cash Rewards Visa', balance: -240.50, color: '#F97316' }, // Orange
  { id: 'cash', name: 'Cash Wallet', balance: 350.00, color: '#10B981' }, // Green
];

// Helper to generate mock transactions for May 2026 (current month up to 21st) and April 2026 (full previous month)
function generateMockTransactions() {
  const list: Schema['transactions'] = [];

  // Seed Rent for current and past month
  list.push({
    id: 't-rent-prev',
    amount: 1200,
    type: 'expense',
    category: 'rent',
    accountId: 'bank',
    date: '2026-04-01',
    description: 'Monthly Apartment Rent',
    createdAt: '2026-04-01T08:00:00.000Z',
  });
  list.push({
    id: 't-rent-curr',
    amount: 1200,
    type: 'expense',
    category: 'rent',
    accountId: 'bank',
    date: '2026-05-01',
    description: 'Monthly Apartment Rent',
    createdAt: '2026-05-01T08:00:00.000Z',
  });

  // Salary for both months
  list.push({
    id: 't-sal-prev',
    amount: 4500,
    type: 'income',
    category: 'salary',
    accountId: 'bank',
    date: '2026-04-01',
    description: 'Monthly Corporate Salary',
    createdAt: '2026-04-01T09:00:00.000Z',
  });
  list.push({
    id: 't-sal-curr',
    amount: 4500,
    type: 'income',
    category: 'salary',
    accountId: 'bank',
    date: '2026-05-01',
    description: 'Monthly Corporate Salary',
    createdAt: '2026-05-01T09:00:00.000Z',
  });

  // In April (Total Month)
  const aprilDailyExps = [
    { day: 2, amount: 24.50, cat: 'food', desc: 'Sushico Dinner', acc: 'credit' },
    { day: 3, amount: 45.00, cat: 'fuel', desc: 'Gas Station fill up', acc: 'credit' },
    { day: 5, amount: 84.20, cat: 'utilities', desc: 'Electricity Bill', acc: 'bank' },
    { day: 6, amount: 15.40, cat: 'food', desc: 'Starbucks Coffee & Pastry', acc: 'cash' },
    { day: 8, amount: 120.00, cat: 'shopping', desc: 'Zara Summer Jacket', acc: 'credit' },
    { day: 10, amount: 18.20, cat: 'pharmacy', desc: 'Multivitamins', acc: 'credit' },
    { day: 12, amount: 64.00, cat: 'games', desc: 'Steam - Elden Ring DLC', acc: 'credit' },
    { day: 13, amount: 35.80, cat: 'food', desc: 'Grocery run at WholeFoods', acc: 'bank' },
    { day: 15, amount: 14.99, cat: 'entertainment', desc: 'Netflix Subscription', acc: 'credit' },
    { day: 17, amount: 42.10, cat: 'fuel', desc: 'Shell Gas Station', acc: 'credit' },
    { day: 18, amount: 55.00, cat: 'food', desc: 'Weekend Ramen with Friends', acc: 'cash' },
    { day: 20, amount: 95.00, cat: 'utilities', desc: 'Water & Internet Bundle', acc: 'bank' },
    { day: 22, amount: 32.50, cat: 'shopping', desc: 'T-shirt sale', acc: 'credit' },
    { day: 24, amount: 110.00, cat: 'games', desc: 'Sony PlayStation Controller', acc: 'credit' }, // High tech spent in April on 24
    { day: 25, amount: 12.00, cat: 'food', desc: 'Snacks & Soda', acc: 'cash' },
    { day: 27, amount: 48.00, cat: 'entertainment', desc: 'Cinema IMAX 2 tickets', acc: 'credit' },
    { day: 29, amount: 42.50, cat: 'food', desc: 'Gourmet Pizza Delivery', acc: 'credit' },
  ];

  aprilDailyExps.forEach((e, idx) => {
    const dayStr = String(e.day).padStart(2, '0');
    list.push({
      id: `t-apr-${idx}`,
      amount: e.amount,
      type: 'expense',
      category: e.cat,
      accountId: e.acc,
      date: `2026-04-${dayStr}`,
      description: e.desc,
      createdAt: `2026-04-${dayStr}T14:30:00.000Z`,
    });
  });

  // In May (Current Month up to today, 21st)
  const mayDailyExps = [
    { day: 2, amount: 28.00, cat: 'food', desc: 'Chipotle Mexican Lunch', acc: 'credit' },
    { day: 4, amount: 52.00, cat: 'fuel', desc: 'Chevron Gas Station', acc: 'credit' },
    { day: 5, amount: 89.50, cat: 'utilities', desc: 'Electricity & Gas Grid', acc: 'bank' },
    { day: 7, amount: 19.50, cat: 'food', desc: 'Cafe & Sweet breakfast', acc: 'cash' },
    { day: 9, amount: 240.00, cat: 'shopping', desc: 'Bose QuietComfort Headphones', acc: 'credit' }, // The highest-spending SINGLE item in May, spent on day 9!
    { day: 11, amount: 45.10, cat: 'pharmacy', desc: 'Prescription & Allergy Drops', acc: 'credit' },
    { day: 12, amount: 15.00, cat: 'entertainment', desc: 'Spotify Premium Family', acc: 'credit' },
    { day: 14, amount: 42.50, cat: 'food', desc: 'Deli lunch platter & drinks', acc: 'cash' },
    { day: 15, amount: 79.99, cat: 'games', desc: 'Logitech G PRO Wireless Mouse', acc: 'credit' }, // Point out the most spent item here too
    { day: 16, amount: 49.00, cat: 'fuel', desc: 'Exxon Fuel Stop', acc: 'credit' },
    { day: 18, amount: 115.00, cat: 'shopping', desc: 'Nike Air Force Sneakers', acc: 'credit' }, // High day expenditure
    { day: 19, amount: 37.00, cat: 'food', desc: 'Home Sushi Platter', acc: 'credit' },
    { day: 20, amount: 98.00, cat: 'utilities', desc: 'Fiber Optics Internet', acc: 'bank' },
    { day: 21, amount: 18.50, cat: 'food', desc: 'Pho Noodle lunch (Today)', acc: 'cash' },
  ];

  mayDailyExps.forEach((e, idx) => {
    const dayStr = String(e.day).padStart(2, '0');
    list.push({
      id: `t-may-${idx}`,
      amount: e.amount,
      type: 'expense',
      category: e.cat,
      accountId: e.acc,
      date: `2026-05-${dayStr}`,
      description: e.desc,
      createdAt: `2026-05-${dayStr}T13:10:00.000Z`,
    });
  });

  return list;
}

const defaultBudgets: Schema['budgets'] = [
  { categoryId: 'food', amount: 450, period: 'monthly' },
  { categoryId: 'shopping', amount: 300, period: 'monthly' },
  { categoryId: 'games', amount: 150, period: 'monthly' },
  { categoryId: 'fuel', amount: 200, period: 'monthly' },
  { categoryId: 'utilities', amount: 250, period: 'monthly' },
  { categoryId: 'all', amount: 2600, period: 'monthly' },
];

const defaultRecurrent: Schema['recurrent'] = [
  {
    id: 'rec-rent',
    amount: 1200,
    categoryId: 'rent',
    accountId: 'bank',
    description: 'Apartment Monthly Rent',
    frequency: 'monthly',
    startDate: '2026-01-01',
    active: true,
  },
  {
    id: 'rec-spotify',
    amount: 15,
    categoryId: 'entertainment',
    accountId: 'credit',
    description: 'Spotify Premium Family',
    frequency: 'monthly',
    startDate: '2026-01-15',
    active: true,
  },
];

const defaultSettings = {
  currency: 'INR',
  currencySymbol: 'Rs.',
  darkTheme: true,
};

// Database Initialization
function readDb(): Schema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialDb: Schema = {
        categories: defaultCategories,
        accounts: defaultAccounts,
        transactions: generateMockTransactions(),
        budgets: defaultBudgets,
        recurrent: defaultRecurrent,
        settings: defaultSettings,
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading/initializing database file:', err);
    return {
      categories: defaultCategories,
      accounts: defaultAccounts,
      transactions: [],
      budgets: defaultBudgets,
      recurrent: defaultRecurrent,
      settings: defaultSettings,
    };
  }
}

function writeDb(data: Schema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// REST API Endpoints
app.get('/api/data', (req, res) => {
  res.json(readDb());
});

// Transactions
app.get('/api/transactions', (req, res) => {
  const db = readDb();
  res.json(db.transactions);
});

app.post('/api/transactions', (req, res) => {
  const db = readDb();
  const tx = {
    id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    amount: Number(req.body.amount || 0),
    type: (req.body.type || 'expense') as 'expense' | 'income',
    category: req.body.category || 'other',
    accountId: req.body.accountId || 'cash',
    date: req.body.date || new Date().toISOString().split('T')[0],
    description: req.body.description || '',
    createdAt: new Date().toISOString(),
  };

  // Adjust account balance corresponding to transaction
  const account = db.accounts.find(a => a.id === tx.accountId);
  if (account) {
    const diff = tx.amount;
    if (tx.type === 'expense') {
      account.balance -= diff;
    } else {
      account.balance += diff;
    }
  }

  db.transactions.push(tx);
  writeDb(db);
  res.status(201).json(tx);
});

app.put('/api/transactions/:id', (req, res) => {
  const db = readDb();
  const idx = db.transactions.findIndex(t => t.id === req.params.id);
  if (idx !== -1) {
    const oldTx = db.transactions[idx];
    
    // Revert old transaction effect on balance
    const oldAcc = db.accounts.find(a => a.id === oldTx.accountId);
    if (oldAcc) {
      if (oldTx.type === 'expense') {
        oldAcc.balance += oldTx.amount;
      } else {
        oldAcc.balance -= oldTx.amount;
      }
    }

    const updatedTx = {
      ...oldTx,
      amount: Number(req.body.amount !== undefined ? req.body.amount : oldTx.amount),
      type: (req.body.type || oldTx.type) as 'expense' | 'income',
      category: req.body.category || oldTx.category,
      accountId: req.body.accountId || oldTx.accountId,
      date: req.body.date || oldTx.date,
      description: req.body.description !== undefined ? req.body.description : oldTx.description,
    };

    // Apply new transaction effect on balance
    const newAcc = db.accounts.find(a => a.id === updatedTx.accountId);
    if (newAcc) {
      if (updatedTx.type === 'expense') {
        newAcc.balance -= updatedTx.amount;
      } else {
        newAcc.balance += updatedTx.amount;
      }
    }

    db.transactions[idx] = updatedTx;
    writeDb(db);
    res.json(updatedTx);
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  const db = readDb();
  const tx = db.transactions.find(t => t.id === req.params.id);
  if (tx) {
    // Revert account balance impact
    const account = db.accounts.find(a => a.id === tx.accountId);
    if (account) {
      if (tx.type === 'expense') {
        account.balance += tx.amount;
      } else {
        account.balance -= tx.amount;
      }
    }

    db.transactions = db.transactions.filter(t => t.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// Budgets
app.get('/api/budgets', (req, res) => {
  res.json(readDb().budgets);
});

app.post('/api/budgets', (req, res) => {
  const db = readDb();
  const { categoryId, amount } = req.body;
  
  const existingIdx = db.budgets.findIndex(b => b.categoryId === categoryId);
  if (existingIdx !== -1) {
    db.budgets[existingIdx].amount = Number(amount);
  } else {
    db.budgets.push({
      categoryId,
      amount: Number(amount),
      period: 'monthly'
    });
  }
  
  writeDb(db);
  res.json({ success: true, budgets: db.budgets });
});

// Recurrent Transactions
app.get('/api/recurrent', (req, res) => {
  res.json(readDb().recurrent);
});

app.post('/api/recurrent', (req, res) => {
  const db = readDb();
  const rx = {
    id: `rec-${Date.now()}`,
    amount: Number(req.body.amount || 0),
    categoryId: req.body.categoryId || 'other',
    accountId: req.body.accountId || 'cash',
    description: req.body.description || '',
    frequency: (req.body.frequency || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'annually',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    active: true,
  };
  
  db.recurrent.push(rx);
  writeDb(db);
  res.status(201).json(rx);
});

app.delete('/api/recurrent/:id', (req, res) => {
  const db = readDb();
  db.recurrent = db.recurrent.filter(r => r.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/recurrent/:id/toggle', (req, res) => {
  const db = readDb();
  const rx = db.recurrent.find(r => r.id === req.params.id);
  if (rx) {
    rx.active = !rx.active;
    writeDb(db);
    res.json(rx);
  } else {
    res.status(404).json({ error: 'Recurrent item not found' });
  }
});

// Settings & Utilities
app.get('/api/settings', (req, res) => {
  res.json(readDb().settings);
});

app.post('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    currency: req.body.currency || 'USD',
    currencySymbol: req.body.currencySymbol || '$',
    darkTheme: req.body.darkTheme !== undefined ? req.body.darkTheme : true,
  };
  writeDb(db);
  res.json(db.settings);
});

app.post('/api/reset', (req, res) => {
  const initialDb: Schema = {
    categories: defaultCategories,
    accounts: defaultAccounts,
    transactions: generateMockTransactions(),
    budgets: defaultBudgets,
    recurrent: defaultRecurrent,
    settings: defaultSettings,
  };
  writeDb(initialDb);
  res.json({ success: true, message: 'Database reset and seeded!' });
});

// Accounts
app.post('/api/accounts', (req, res) => {
  const db = readDb();
  const { name, balance, color } = req.body;
  const newAccount = {
    id: `acc-${Date.now()}`,
    name,
    balance: Number(balance || 0),
    color: color || '#64748B'
  };
  db.accounts.push(newAccount);
  writeDb(db);
  res.status(201).json(newAccount);
});

app.delete('/api/accounts/:id', (req, res) => {
  const db = readDb();
  // Filter out the account, merge balance into checking if needed, or simply delete
  db.accounts = db.accounts.filter(a => a.id !== req.params.id);
  // Also clean up or adjust transactions if they belonged to this account
  writeDb(db);
  res.json({ success: true });
});

// Vite/Custom production integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is booted and running securely at http://localhost:${PORT}`);
  });
}

startServer();
