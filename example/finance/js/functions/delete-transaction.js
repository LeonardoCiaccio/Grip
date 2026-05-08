import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { logEntry } from '../ui/logger.js'

export function registerDeleteTransaction() {
  grip.register({
    name: 'deleteTransaction',
    validate({ txnId }) {
      if (!txnId || typeof txnId !== 'string')
        throw new Error('txnId must be a non-empty string.')
    },
    business: async ({ txnId }) => {
      const txns = store.getTransactions()
      const idx  = txns.findIndex(t => t.id === txnId)
      if (idx === -1) throw new Error('Transaction not found.')
      const [removed] = txns.splice(idx, 1)
      store.saveTransactions(txns)
      logEntry('business', `deleted transaction ${txnId} (${removed.category} €${removed.amount})`)
      return { deleted: removed.id, category: removed.category }
    },
  })
}
