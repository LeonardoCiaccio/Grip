const $log = document.getElementById('pipelineLog')

const PHASE_MAP = {
  before:       { tag: 'BEFORE', color: 'text-sky-400',     bg: 'bg-sky-400/10'    },
  guard:        { tag: 'GUARD',  color: 'text-amber-400',   bg: 'bg-amber-400/10'  },
  validate:     { tag: 'VALID',  color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  business:     { tag: 'EXEC',   color: 'text-emerald-400', bg: 'bg-emerald-400/10'},
  assertResult: { tag: 'ASSERT', color: 'text-teal-400',    bg: 'bg-teal-400/10'   },
  after:        { tag: 'AFTER',  color: 'text-sky-400',     bg: 'bg-sky-400/10'    },
  error:        { tag: 'ERROR',  color: 'text-red-400',     bg: 'bg-red-400/10'    },
  info:         { tag: 'INFO',   color: 'text-gray-400',    bg: 'bg-gray-400/10'   },
}

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function clearLog() {
  $log.innerHTML = ''
}

export function logEntry(phase, message) {
  const p  = PHASE_MAP[phase] ?? PHASE_MAP.info
  const el = document.createElement('div')
  el.className = 'pipeline-entry flex items-start gap-2 py-0.5'
  el.innerHTML =
    `<span class="shrink-0 inline-block text-[10px] font-bold ${p.color} ${p.bg} px-1.5 py-0.5 rounded min-w-[46px] text-center">${p.tag}</span>` +
    `<span class="text-gray-400 leading-tight break-all">${escHtml(message)}</span>`
  $log.appendChild(el)
  $log.scrollTop = $log.scrollHeight
}

export function logSeparator(label) {
  const el = document.createElement('div')
  el.className = 'pipeline-entry flex items-center gap-2 my-1.5'
  el.innerHTML =
    `<div class="flex-1 h-px bg-gray-800"></div>` +
    `<span class="text-[10px] text-gray-600 font-semibold mono tracking-wider uppercase">${escHtml(label)}</span>` +
    `<div class="flex-1 h-px bg-gray-800"></div>`
  $log.appendChild(el)
  $log.scrollTop = $log.scrollHeight
}

export const UILogger = {
  log: (phase, fnName, message) => logEntry(phase, `[${fnName}] ${message}`),
}
