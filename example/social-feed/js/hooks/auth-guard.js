import { grip } from '../grip-instance.js'

export function applyAuthGuard() {
  grip.hookAll({
    label: 'auth-guard',
    guard: (payload, ctx) => {
      if (!ctx.user?.id) throw new Error('Authentication required — no active user in context')
    },
  })
}
