import { registerLoadTransactions }     from './functions/load-transactions.js'
import { registerAddTransaction }        from './functions/add-transaction.js'
import { registerDeleteTransaction }     from './functions/delete-transaction.js'
import { registerCategorizeTransaction } from './functions/categorize-transaction.js'
import { registerCalculateBalance }      from './functions/calculate-balance.js'
import { registerGenerateSummary }       from './functions/generate-summary.js'
import { registerSearchTransactions }    from './functions/search-transactions.js'
import { registerExportCsv }             from './functions/export-csv.js'
import { registerSetBudget }             from './functions/set-budget.js'

import { applyTracer }          from './hooks/tracer.js'
import { applyAuditLog }        from './hooks/audit-log.js'
import { applyBudgetEnforcer }  from './hooks/budget-enforcer.js'
import { applyAmountNormalizer } from './hooks/amount-normalizer.js'

import { initController }            from './ui/controller.js'
import { openGripMap, closeGripMap } from './ui/grip-graph.js'

// ── Register functions ────────────────────────────────────────────────────────
registerLoadTransactions()
registerAddTransaction()
registerDeleteTransaction()
registerCategorizeTransaction()
registerCalculateBalance()
registerGenerateSummary()
registerSearchTransactions()
registerExportCsv()
registerSetBudget()

// ── Apply hooks ───────────────────────────────────────────────────────────────
applyTracer()
applyAuditLog()
applyBudgetEnforcer()
applyAmountNormalizer()

// ── Start UI ──────────────────────────────────────────────────────────────────
initController()

document.getElementById('mapBtn').addEventListener('click', openGripMap)
document.getElementById('closeMapBtn').addEventListener('click', closeGripMap)
document.getElementById('modalBackdrop').addEventListener('click', closeGripMap)
