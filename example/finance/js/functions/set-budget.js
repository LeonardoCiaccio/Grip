import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { logEntry } from '../ui/logger.js'

export function registerSetBudget() {
  grip.register({
    name: 'setBudget',
    validate({ category, limit }) {
      if (!category || typeof category !== 'string')
        throw new Error('category must be a non-empty string.')
      if (typeof limit !== 'number' || limit < 0)
        throw new Error('limit must be a non-negative number.')
    },
    business: async ({ category, limit }) => {
      const budgets = store.getBudgets()
      budgets[category] = limit
      store.saveBudgets(budgets)
      logEntry('business', `budget set: ${category} → €${limit.toFixed(2)} ✓`)
      return { category, limit, budgets }
    },
  })
}
