import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { logEntry } from '../ui/logger.js'

export function registerGenerateSummary() {
  grip.register({
    name: 'generateSummary',
    validate() {},
    business: async () => {
      const txns    = store.getTransactions()
      const budgets = store.getBudgets()
      const byCategory = {}

      for (const t of txns) {
        if (!byCategory[t.category]) byCategory[t.category] = { income: 0, expense: 0 }
        if (t.type === 'income')  byCategory[t.category].income  += t.amount
        if (t.type === 'expense') byCategory[t.category].expense += t.amount
      }

      const entries = Object.entries(byCategory).map(([cat, { income, expense }]) => ({
        category: cat,
        income,
        expense,
        net:    income - expense,
        budget: budgets[cat] ?? null,
        overBudget: budgets[cat] != null && expense > budgets[cat],
      })).sort((a, b) => b.expense - a.expense)

      logEntry('business', `summarized ${entries.length} categories ✓`)
      return entries
    },
  })
}
