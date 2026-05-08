const TX_KEY     = 'grip_finance_txns_v1'
const BUDGET_KEY = 'grip_finance_budgets_v1'

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

const SEED_TRANSACTIONS = [
  { id: 't1', type: 'income',  amount: 3200, category: 'salary',        description: 'Monthly salary',         date: '2026-05-01', createdAt: Date.now() - 86400000 * 7  },
  { id: 't2', type: 'expense', amount:  480, category: 'rent',           description: 'May rent payment',       date: '2026-05-02', createdAt: Date.now() - 86400000 * 6  },
  { id: 't3', type: 'expense', amount:   92, category: 'food',           description: 'Weekly groceries',       date: '2026-05-03', createdAt: Date.now() - 86400000 * 5  },
  { id: 't4', type: 'income',  amount:  750, category: 'freelance',      description: 'Design project invoice', date: '2026-05-04', createdAt: Date.now() - 86400000 * 4  },
  { id: 't5', type: 'expense', amount:   45, category: 'transport',      description: 'Monthly bus pass',       date: '2026-05-05', createdAt: Date.now() - 86400000 * 3  },
  { id: 't6', type: 'expense', amount:   18, category: 'entertainment',  description: 'Streaming subscription', date: '2026-05-06', createdAt: Date.now() - 86400000 * 2  },
  { id: 't7', type: 'expense', amount:   65, category: 'health',         description: 'Pharmacy',               date: '2026-05-07', createdAt: Date.now() - 86400000      },
  { id: 't8', type: 'expense', amount:  130, category: 'utilities',      description: 'Electricity bill',       date: '2026-05-07', createdAt: Date.now() - 3600000       },
]

const DEFAULT_BUDGETS = {
  food:          300,
  transport:     100,
  health:        200,
  entertainment: 100,
  utilities:     200,
  rent:          600,
  other:         150,
}

export const store = {
  getTransactions() {
    try {
      const raw = localStorage.getItem(TX_KEY)
      return raw ? JSON.parse(raw) : structuredClone(SEED_TRANSACTIONS)
    } catch {
      return structuredClone(SEED_TRANSACTIONS)
    }
  },
  saveTransactions(txns) {
    localStorage.setItem(TX_KEY, JSON.stringify(txns))
  },
  getBudgets() {
    try {
      const raw = localStorage.getItem(BUDGET_KEY)
      return raw ? JSON.parse(raw) : structuredClone(DEFAULT_BUDGETS)
    } catch {
      return structuredClone(DEFAULT_BUDGETS)
    }
  },
  saveBudgets(budgets) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets))
  },
  reset() {
    localStorage.removeItem(TX_KEY)
    localStorage.removeItem(BUDGET_KEY)
  },
}
