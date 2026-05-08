import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerLoadTransactions() {
  grip.register({
    name: 'loadTransactions',
    validate() {},
    business: async () => {
      const txns = store.getTransactions()
      return [...txns].sort((a, b) => b.createdAt - a.createdAt)
    },
  })
}
