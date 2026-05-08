import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

const RATE_LIMIT_MS = 3_000
let lastFiredAt = 0

export function applyRateLimiter() {
  grip.hook('countDivs', {
    guard: () => {
      const elapsed = Date.now() - lastFiredAt
      if (lastFiredAt && elapsed < RATE_LIMIT_MS) {
        const wait = ((RATE_LIMIT_MS - elapsed) / 1000).toFixed(1)
        throw new Error(`Rate limit active — retry in ${wait}s.`)
      }
      lastFiredAt = Date.now()
      logEntry('guard', 'rate limit check passed ✓')
    },
    label: 'rate-limiter'
  })
}
