import { grip }      from '../grip-instance.js'
import { store, uid } from '../store.js'
import { logEntry }   from '../ui/logger.js'

const VALID_TYPES = ['income', 'expense']
const CATEGORIES  = ['salary', 'freelance', 'food', 'transport', 'health', 'entertainment', 'utilities', 'rent', 'other']

export function registerAddTransaction() {
  grip.register({
    name: 'addTransaction',
    validate({ type, amount, category, description, date }) {
      logEntry('validate', 'validating transaction fields…')
      if (!VALID_TYPES.includes(type))
        throw new Error(`type must be one of: ${VALID_TYPES.join(', ')}.`)
      if (typeof amount !== 'number' || amount <= 0)
        throw new Error('amount must be a positive number.')
      if (!CATEGORIES.includes(category))
        throw new Error(`category must be one of: ${CATEGORIES.join(', ')}.`)
      if (!description || typeof description !== 'string' || !description.trim())
        throw new Error('description must be a non-empty string.')
      if (!date || typeof date !== 'string')
        throw new Error('date must be a string (YYYY-MM-DD).')
      logEntry('validate', 'all fields valid ✓')
    },
    business: async ({ type, amount, category, description, date }, ctx) => {
      logEntry('business', `adding ${type}: ${category} — €${amount.toFixed(2)}`)
      const txns = store.getTransactions()
      const txn  = {
        id: uid(),
        type,
        amount,
        category,
        description: description.trim(),
        date,
        createdAt: Date.now(),
        addedBy: ctx.user ?? 'anonymous',
      }
      txns.unshift(txn)
      store.saveTransactions(txns)
      logEntry('business', `transaction saved with id ${txn.id} ✓`)
      return txn
    },
    assertResult(txn) {
      if (!txn?.id) throw new Error('Transaction was not persisted correctly.')
    },
  })
}
