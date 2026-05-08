import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerSearchTransactions() {
  grip.register({
    name: 'searchTransactions',
    validate({ query }) {
      if (typeof query !== 'string')
        throw new Error('query must be a string.')
    },
    business: async ({ query, type, category }) => {
      const txns = store.getTransactions()
      const q    = query.toLowerCase().trim()

      return txns
        .filter(t => {
          if (type     && t.type     !== type)     return false
          if (category && t.category !== category) return false
          if (q && !t.description.toLowerCase().includes(q) && !t.category.includes(q)) return false
          return true
        })
        .sort((a, b) => b.createdAt - a.createdAt)
    },
  })
}
