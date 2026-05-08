const $log = document.getElementById('pipelineLog')

const PHASE_MAP = {
  before:       { color: 'text-sky-400',    bg: 'bg-sky-500/10',    tag: 'before'   },
  guard:        { color: 'text-amber-400',  bg: 'bg-amber-500/10',  tag: 'guard'    },
  validate:     { color: 'text-teal-400',   bg: 'bg-teal-500/10',   tag: 'validate' },
  business:     { color: 'text-violet-400', bg: 'bg-violet-500/10', tag: 'business' },
  assertResult: { color: 'text-teal-400',   bg: 'bg-teal-500/10',   tag: 'assert'   },
  after:        { color: 'text-sky-400',    bg: 'bg-sky-500/10',    tag: 'after'    },
  error:        { color: 'text-red-400',    bg: 'bg-red-500/10',    tag: 'error'    },
}

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function clearLog() {
  $log.innerHTML = ''
}

export function logEntry(phase, message) {
  const { color, bg, tag } = PHASE_MAP[phase] ?? { color: 'text-gray-400', bg: 'bg-gray-500/10', tag: phase }

  const el = document.createElement('div')
  el.className = 'pipeline-entry flex items-start gap-3 leading-relaxed'
  el.innerHTML =
    `<span class="shrink-0 ${color} ${bg} rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase w-[72px] text-center">${tag}</span>` +
    `<span class="text-gray-600">→</span>` +
    `<span class="text-gray-300 flex-1">${escHtml(message)}</span>`

  $log.appendChild(el)
  $log.scrollTop = $log.scrollHeight
}

export const UILogger = {
  error: (msg, err) => logEntry('error', `${msg} ${err?.message ?? ''}`.trim()),
  warn:  ()         => { /* suppress pending-hook warnings from UI */ }
}
