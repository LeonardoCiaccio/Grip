import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { logEntry } from '../ui/logger.js'

export function registerCalculateBalance() {
  grip.register({
    name: 'calculateBalance',
    validate() {},
    business: async () => {
      const txns    = store.getTransactions()
      const income  = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const balance = income - expense
      logEntry('business', `income €${income.toFixed(2)} · expenses €${expense.toFixed(2)} · balance €${balance.toFixed(2)}`)
      return { balance, income, expense, transactionCount: txns.length }
    },
    assertResult({ balance, income, expense }) {
      if (typeof balance !== 'number' || typeof income !== 'number' || typeof expense !== 'number')
        throw new Error('Balance result must contain numeric balance, income, and expense.')
    },
  })
}
