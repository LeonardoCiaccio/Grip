import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { logEntry } from '../ui/logger.js'

export function applyBudgetEnforcer() {
  grip.hook('addTransaction', {
    label: 'budget-enforcer',
    guard: ({ args }) => {
      if (args.type !== 'expense') return
      const budgets = store.getBudgets()
      const limit   = budgets[args.category]
      if (limit == null) return

      const txns  = store.getTransactions()
      const spent = txns
        .filter(t => t.type === 'expense' && t.category === args.category)
        .reduce((s, t) => s + t.amount, 0)

      const afterSpend = spent + args.amount
      logEntry('guard', `budget check: ${args.category} — spent €${spent.toFixed(2)} + €${args.amount.toFixed(2)} vs limit €${limit.toFixed(2)}`)

      if (afterSpend > limit) {
        throw new Error(
          `Budget exceeded for "${args.category}": €${afterSpend.toFixed(2)} would exceed the €${limit.toFixed(2)} limit (currently €${spent.toFixed(2)} spent).`
        )
      }
      logEntry('guard', `budget ok — €${(limit - afterSpend).toFixed(2)} remaining ✓`)
    },
  })
}
