import { grip }                                         from '../grip-instance.js'
import { auditLog }                                       from '../hooks/audit-log.js'
import { clearLog, logEntry, logSeparator }               from './logger.js'
import { renderTransactions, renderBalance, renderSummary, renderAuditLog } from './transactions.js'

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $balanceCard   = document.getElementById('balanceCard')
const $txnList       = document.getElementById('txnList')
const $summaryList   = document.getElementById('summaryList')
const $auditList     = document.getElementById('auditList')
const $statusDot     = document.getElementById('statusDot')
const $errorToast    = document.getElementById('errorToast')
const $errorMsg      = document.getElementById('errorMsg')

const $typeSelect    = document.getElementById('typeSelect')
const $amountInput   = document.getElementById('amountInput')
const $categorySelect= document.getElementById('categorySelect')
const $descInput     = document.getElementById('descInput')
const $dateInput     = document.getElementById('dateInput')
const $addBtn        = document.getElementById('addBtn')
const $autoBtn       = document.getElementById('autoBtn')
const $searchInput   = document.getElementById('searchInput')
const $filterType    = document.getElementById('filterType')
const $filterCat     = document.getElementById('filterCat')
const $exportBtn     = document.getElementById('exportBtn')
const $budgetCat     = document.getElementById('budgetCat')
const $budgetLimit   = document.getElementById('budgetLimit')
const $budgetBtn     = document.getElementById('budgetBtn')

let toastTimer = null

function showError(msg) {
  $errorMsg.textContent = msg
  $errorToast.classList.remove('hidden', 'opacity-0')
  $errorToast.classList.add('opacity-100')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    $errorToast.classList.add('opacity-0')
    setTimeout(() => $errorToast.classList.add('hidden'), 300)
  }, 5000)
}

function setStatus(state) {
  const map = {
    idle:    'w-2 h-2 rounded-full bg-gray-700 shrink-0 transition-colors duration-300',
    loading: 'w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 transition-colors duration-300',
    success: 'w-2 h-2 rounded-full bg-emerald-500 shrink-0 transition-colors duration-300',
    error:   'w-2 h-2 rounded-full bg-red-500 shrink-0 transition-colors duration-300',
  }
  $statusDot.className = map[state] ?? map.idle
}

async function refreshAll() {
  setStatus('loading')
  const [balRes, txnRes, sumRes] = await Promise.all([
    grip.fire('calculateBalance', {}, {}),
    grip.fire('searchTransactions', {
      query:    $searchInput.value.trim(),
      type:     $filterType.value  || undefined,
      category: $filterCat.value   || undefined,
    }, {}),
    grip.fire('generateSummary', {}, {}),
  ])

  if (balRes.isSuccess) renderBalance($balanceCard, balRes.result)
  if (txnRes.isSuccess) renderTransactions($txnList, txnRes.result, onDelete)
  if (sumRes.isSuccess) renderSummary($summaryList, sumRes.result)
  renderAuditLog($auditList, auditLog)
  setStatus(balRes.isSuccess ? 'success' : 'error')
}

async function onAdd() {
  const args = {
    type:        $typeSelect.value,
    amount:      parseFloat($amountInput.value),
    category:    $categorySelect.value,
    description: $descInput.value.trim(),
    date:        $dateInput.value,
  }

  logSeparator('addTransaction')
  $addBtn.disabled = true
  const res = await grip.fire('addTransaction', args, {})
  $addBtn.disabled = false

  if (!res.isSuccess) { showError(res.message.replace(/^\w+ \| /, '')); setStatus('error'); return }

  $descInput.value  = ''
  $amountInput.value = ''
  await refreshAll()
}

async function onAutoCategory() {
  const desc = $descInput.value.trim()
  if (!desc) return
  logSeparator('categorizeTransaction')
  const res = await grip.fire('categorizeTransaction', { description: desc }, {})
  if (res.isSuccess) {
    $categorySelect.value = res.result.category
    logEntry('info', `auto-category → ${res.result.category}`)
  }
}

async function onDelete(txnId) {
  logSeparator('deleteTransaction')
  const res = await grip.fire('deleteTransaction', { txnId }, {})
  if (!res.isSuccess) { showError(res.message.replace(/^\w+ \| /, '')); return }
  await refreshAll()
}

async function onExport() {
  logSeparator('exportCsv')
  const res = await grip.fire('exportCsv', {}, {})
  if (!res.isSuccess) return
  const blob = new Blob([res.result.csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
  logEntry('info', `downloaded ${res.result.count} transactions as CSV`)
}

async function onSetBudget() {
  const category = $budgetCat.value
  const limit    = parseFloat($budgetLimit.value)
  if (!category || isNaN(limit)) return
  logSeparator('setBudget')
  const res = await grip.fire('setBudget', { category, limit }, {})
  if (!res.isSuccess) { showError(res.message.replace(/^\w+ \| /, '')); return }
  $budgetLimit.value = ''
  await refreshAll()
}

export function initController() {
  $dateInput.value = new Date().toISOString().slice(0, 10)

  $addBtn.addEventListener('click', onAdd)
  $autoBtn.addEventListener('click', onAutoCategory)
  $exportBtn.addEventListener('click', onExport)
  $budgetBtn.addEventListener('click', onSetBudget)
  $descInput.addEventListener('keydown', e => { if (e.key === 'Enter') onAdd() })

  let searchTimer
  const onFilter = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      clearLog()
      logSeparator('searchTransactions')
      refreshAll()
    }, 300)
  }
  $searchInput.addEventListener('input',  onFilter)
  $filterType.addEventListener('change',  onFilter)
  $filterCat.addEventListener('change',   onFilter)

  clearLog()
  logSeparator('calculateBalance')
  refreshAll()
}
