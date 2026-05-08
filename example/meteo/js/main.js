import { registerGeocodeCity }  from './functions/geocode-city.js'
import { registerFetchWeather }  from './functions/fetch-weather.js'
import { registerFormatWeather } from './functions/format-weather.js'
import { applyTracer }           from './hooks/tracer.js'
import { applyRateLimiter }      from './hooks/rate-limiter.js'
import { applyCityNormalizer }   from './hooks/city-normalizer.js'
import { initController }        from './ui/controller.js'
import { openGripMap, closeGripMap } from './ui/grip-graph.js'

// ── Register functions ────────────────────────────────────────────────────────
registerGeocodeCity()
registerFetchWeather()
registerFormatWeather()

// ── Apply hooks ───────────────────────────────────────────────────────────────
applyTracer()
applyRateLimiter()
applyCityNormalizer()

// ── Start UI ──────────────────────────────────────────────────────────────────
initController()

document.getElementById('mapBtn').addEventListener('click', openGripMap)
document.getElementById('closeMapBtn').addEventListener('click', closeGripMap)
document.getElementById('modalBackdrop').addEventListener('click', closeGripMap)
