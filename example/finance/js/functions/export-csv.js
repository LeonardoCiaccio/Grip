import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { logEntry } from '../ui/logger.js'

export function registerExportCsv() {
  grip.register({
    name: 'exportCsv',
    validate() {},
    business: async () => {
      const txns  = store.getTransactions()
      const rows  = [['id', 'type', 'amount', 'category', 'description', 'date']]
      for (const t of txns) {
        rows.push([t.id, t.type, t.amount.toFixed(2), t.category, `"${t.description.replace(/"/g, '""')}"`, t.date])
      }
      const csv = rows.map(r => r.join(',')).join('\n')
      logEntry('business', `exported ${txns.length} transactions as CSV ✓`)
      return { csv, count: txns.length }
    },
    assertResult({ csv }) {
      if (typeof csv !== 'string') throw new Error('CSV export must produce a string.')
    },
  })
}
