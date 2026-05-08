import { registerCountDivs }    from './functions/count-divs.js'
import { applyTracer }           from './hooks/tracer.js'
import { applyRateLimiter }      from './hooks/rate-limiter.js'
import { applyUrlInspector }     from './hooks/url-inspector.js'
import { initController }        from './ui/controller.js'
import { openGripMap, closeGripMap } from './ui/grip-graph.js'

// ── Register functions ────────────────────────────────────────────────────────
registerCountDivs()

// ── Apply hooks ───────────────────────────────────────────────────────────────
applyTracer()
applyRateLimiter()
applyUrlInspector()

// ── Start UI ──────────────────────────────────────────────────────────────────
initController()

document.getElementById('mapBtn').addEventListener('click', openGripMap)
document.getElementById('closeMapBtn').addEventListener('click', closeGripMap)
document.getElementById('modalBackdrop').addEventListener('click', closeGripMap)
