import { grip } from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

export function applyAmountNormalizer() {
  grip.hook('addTransaction', {
    label: 'amount-normalizer',
    before: ({ args }) => {
      if (typeof args.amount !== 'number') return
      const original = args.amount
      args.amount    = Math.round(original * 100) / 100
      if (original !== args.amount)
        logEntry('before', `amount normalized: ${original} → ${args.amount}`)
      else
        logEntry('before', `amount ${args.amount} — no normalization needed`)
    },
  })
}
