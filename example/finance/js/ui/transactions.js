import { escHtml } from './logger.js'

const CATEGORY_ICON = {
  salary:        '💼',
  freelance:     '🧑‍💻',
  food:          '🍽️',
  transport:     '🚌',
  health:        '💊',
  entertainment: '🎬',
  utilities:     '💡',
  rent:          '🏠',
  other:         '📦',
}

function fmt(amount) {
  return amount.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function renderTransactions($el, txns, onDelete) {
  if (!txns.length) {
    $el.innerHTML = '<p class="text-gray-700 italic text-sm text-center py-8">No transactions found.</p>'
    return
  }

  $el.innerHTML = txns.map(t => {
    const isIncome = t.type === 'income'
    const icon     = CATEGORY_ICON[t.category] ?? '📦'
    const sign     = isIncome ? '+' : '−'
    const cls      = isIncome ? 'text-emerald-400' : 'text-red-400'

    return `
      <div class="group flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 rounded-xl transition" data-txn-id="${escHtml(t.id)}">
        <span class="text-xl w-7 text-center shrink-0">${icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-200 truncate">${escHtml(t.description)}</p>
          <p class="text-[11px] text-gray-600">${escHtml(t.category)} · ${escHtml(t.date)}</p>
        </div>
        <span class="mono text-sm font-bold ${cls} shrink-0">${sign}€${fmt(t.amount)}</span>
        <button class="delete-txn shrink-0 opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition ml-1" data-txn-id="${escHtml(t.id)}" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
          </svg>
        </button>
      </div>`
  }).join('')

  $el.querySelectorAll('.delete-txn').forEach(btn =>
    btn.addEventListener('click', () => onDelete(btn.dataset.txnId))
  )
}

export function renderBalance($el, { balance, income, expense }) {
  const pos = balance >= 0
  $el.innerHTML = `
    <div class="text-center space-y-1">
      <p class="text-xs text-gray-600 uppercase tracking-widest font-semibold">Net balance</p>
      <p class="text-5xl font-bold mono ${pos ? 'text-emerald-400' : 'text-red-400'} leading-none">
        ${pos ? '+' : '−'}€${fmt(Math.abs(balance))}
      </p>
      <div class="flex justify-center gap-6 pt-2 text-sm">
        <span class="text-emerald-600 mono">+€${fmt(income)} income</span>
        <span class="text-red-600 mono">−€${fmt(expense)} expenses</span>
      </div>
    </div>`
}

export function renderSummary($el, entries, budgets) {
  if (!entries.length) {
    $el.innerHTML = '<p class="text-gray-700 italic text-xs">No data yet.</p>'
    return
  }
  $el.innerHTML = entries.map(e => {
    const icon = CATEGORY_ICON[e.category] ?? '📦'
    const pct  = e.budget ? Math.min(100, Math.round((e.expense / e.budget) * 100)) : null
    const barCls = e.overBudget ? 'bg-red-500' : pct > 75 ? 'bg-amber-400' : 'bg-indigo-500'
    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-sm">${icon}</span>
            <span class="text-xs text-gray-300 truncate">${escHtml(e.category)}</span>
            ${e.overBudget ? '<span class="text-[10px] text-red-400 font-bold shrink-0">OVER</span>' : ''}
          </div>
          <div class="text-right shrink-0">
            ${e.expense ? `<span class="text-xs mono text-red-400">−€${fmt(e.expense)}</span>` : ''}
            ${e.income  ? `<span class="text-xs mono text-emerald-400 ml-1">+€${fmt(e.income)}</span>` : ''}
          </div>
        </div>
        ${pct != null ? `
          <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full ${barCls} rounded-full transition-all" style="width:${pct}%"></div>
          </div>
          <p class="text-[10px] text-gray-600">€${fmt(e.expense)} / €${fmt(e.budget)} budget</p>
        ` : ''}
      </div>`
  }).join('')
}

export function renderAuditLog($el, entries) {
  if (!entries.length) {
    $el.innerHTML = '<p class="text-gray-700 italic text-xs">No write operations yet.</p>'
    return
  }
  $el.innerHTML = entries.slice(0, 15).map(e => {
    const ok  = e.success
    const dot = ok ? 'bg-emerald-500' : 'bg-red-500'
    const ts  = new Date(e.timestamp).toLocaleTimeString()
    return `
      <div class="flex items-start gap-2 py-0.5">
        <span class="w-1.5 h-1.5 rounded-full ${dot} mt-1.5 shrink-0"></span>
        <div class="min-w-0 flex-1">
          <span class="text-[11px] mono text-gray-400">${escHtml(e.fn)}</span>
          ${e.errorType ? `<span class="text-[10px] text-red-400 ml-1">[${escHtml(e.errorType)}]</span>` : ''}
          <span class="text-[10px] text-gray-600 ml-1">${ts}</span>
        </div>
      </div>`
  }).join('')
}
