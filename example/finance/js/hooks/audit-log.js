import { grip } from '../grip-instance.js'

const WRITE_OPS = new Set(['addTransaction', 'deleteTransaction', 'setBudget'])

export const auditLog = []

export function applyAuditLog() {
  grip.hookAll({
    label: 'audit-log',
    after: ({ name, args, result }) => {
      if (!WRITE_OPS.has(name)) return
      auditLog.unshift({
        fn:        name,
        success:   result?.isSuccess ?? false,
        errorType: result?.errorType ?? null,
        args:      { ...args },
        timestamp: Date.now(),
      })
      if (auditLog.length > 50) auditLog.pop()
    },
  })
}
