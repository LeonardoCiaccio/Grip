import { grip }                        from '../grip-instance.js'
import { clearLog, logEntry, escHtml } from './logger.js'

const $urlInput     = document.getElementById('urlInput')
const $checkBtn     = document.getElementById('checkBtn')
const $iconSearch   = document.getElementById('iconSearch')
const $iconSpin     = document.getElementById('iconSpin')
const $btnLabel     = document.getElementById('btnLabel')
const $statusDot    = document.getElementById('statusDot')
const $resultCard   = document.getElementById('resultCard')
const $responseCard = document.getElementById('responseCard')
const $responseJson = document.getElementById('responseJson')

function setLoading(on) {
  $checkBtn.disabled = on
  $iconSearch.classList.toggle('hidden', on)
  $iconSpin.classList.toggle('hidden', !on)
  $btnLabel.textContent = on ? 'Checking…' : 'Check'
  $statusDot.className = on
    ? 'w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 transition-colors duration-300'
    : 'w-2 h-2 rounded-full bg-gray-700 shrink-0 transition-colors duration-300'
}

function renderResult(res) {
  $resultCard.classList.remove('hidden')

  if (res.isSuccess) {
    const { count, title, url } = res.result
    $resultCard.innerHTML =
      `<div class="flex items-start gap-4">` +
        `<div class="shrink-0 w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">` +
          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-emerald-400">` +
            `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />` +
          `</svg>` +
        `</div>` +
        `<div class="flex-1 min-w-0">` +
          `<div class="flex items-baseline gap-2">` +
            `<span class="text-5xl font-bold text-white tabular-nums">${count.toLocaleString()}</span>` +
            `<span class="text-gray-400 text-sm font-medium mono">&lt;div&gt; elements</span>` +
          `</div>` +
          (title ? `<p class="text-gray-500 text-sm mt-1.5 truncate">${escHtml(title)}</p>` : '') +
          `<p class="text-gray-700 text-xs mt-1 truncate mono">${escHtml(url)}</p>` +
        `</div>` +
      `</div>`

    $statusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 shrink-0 transition-colors duration-300'

  } else {
    const tagColors = {
      GUARD:        'text-amber-400  bg-amber-400/10  border-amber-500/30',
      VALIDATION:   'text-red-400    bg-red-400/10    border-red-500/30',
      BUSINESS:     'text-red-400    bg-red-400/10    border-red-500/30',
      TIMEOUT:      'text-orange-400 bg-orange-400/10 border-orange-500/30',
      ASSERT_RESULT:'text-red-400    bg-red-400/10    border-red-500/30',
    }
    const cls  = tagColors[res.errorType] ?? 'text-red-400 bg-red-400/10 border-red-500/30'
    const body = res.message.replace(/^countDivs \| /, '')

    $resultCard.innerHTML =
      `<div class="flex items-start gap-4">` +
        `<div class="shrink-0 w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">` +
          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-red-400">` +
            `<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />` +
          `</svg>` +
        `</div>` +
        `<div class="flex-1 min-w-0">` +
          `<span class="inline-block mono text-xs font-semibold border rounded px-2 py-0.5 ${cls}">${res.errorType}</span>` +
          `<p class="text-gray-200 text-sm mt-2">${escHtml(body)}</p>` +
        `</div>` +
      `</div>`

    $statusDot.className = 'w-2 h-2 rounded-full bg-red-500 shrink-0 transition-colors duration-300'
  }
}

function renderResponse(res) {
  $responseCard.classList.remove('hidden')
  const safe = JSON.parse(JSON.stringify(res, (_, v) =>
    v instanceof Error ? { message: v.message } : v
  ))
  $responseJson.textContent = JSON.stringify(safe, null, 2)
}

async function onCheck() {
  const url = $urlInput.value.trim()

  clearLog()
  $resultCard.classList.add('hidden')
  $responseCard.classList.add('hidden')
  setLoading(true)

  let res
  try {
    res = await grip.fire('countDivs', { url })
  } catch (err) {
    logEntry('error', err.message)
    setLoading(false)
    return
  }

  renderResult(res)
  renderResponse(res)
  setLoading(false)
}

export function initController() {
  if (/^https?:/.test(location.protocol))
    $urlInput.value = location.origin + '/'

  $checkBtn.addEventListener('click', onCheck)
  $urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') onCheck() })
}
