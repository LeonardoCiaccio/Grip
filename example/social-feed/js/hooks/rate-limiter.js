import { grip } from '../grip-instance.js'

const last   = {}
const LIMITS = {
  createPost:    5000,
  addComment:    2000,
  deletePost:    1000,
  deleteComment: 1000,
  likePost:       500,
}

export function applyRateLimiter() {
  for (const [fn, ms] of Object.entries(LIMITS)) {
    grip.hook(fn, {
      label: 'rate-limiter',
      guard: (payload, ctx) => {
        const key = `${fn}:${ctx.user?.id ?? '_'}`
        const now = Date.now()
        if (last[key] && now - last[key] < ms) {
          const wait = ((ms - (now - last[key])) / 1000).toFixed(1)
          throw new Error(`Rate limited — wait ${wait}s before retrying`)
        }
        last[key] = now
      },
    })
  }
}
