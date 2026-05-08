import { grip }                            from '../grip-instance.js'
import { clearLog, logEntry, logSeparator } from './logger.js'
import { renderWeatherCard, renderErrorCard } from './weather-card.js'

const $cityInput    = document.getElementById('cityInput')
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
  $btnLabel.textContent = on ? 'Fetching…' : 'Get weather'
  $statusDot.className = on
    ? 'w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 transition-colors duration-300'
    : 'w-2 h-2 rounded-full bg-gray-700 shrink-0 transition-colors duration-300'
}

function renderResponses(responses) {
  $responseCard.classList.remove('hidden')
  const safe = JSON.parse(JSON.stringify(responses, (_, v) =>
    v instanceof Error ? { message: v.message } : v
  ))
  $responseJson.textContent = JSON.stringify(safe, null, 2)
}

async function onCheck() {
  const city = $cityInput.value.trim()

  clearLog()
  $resultCard.classList.add('hidden')
  $responseCard.classList.add('hidden')
  setLoading(true)

  // ── Step 1: geocodeCity ────────────────────────────────────────────────────
  logSeparator('geocodeCity')
  const geoRes = await grip.fire('geocodeCity', { city })
  if (!geoRes.isSuccess) {
    renderErrorCard($resultCard, geoRes)
    renderResponses({ geocodeCity: geoRes })
    $statusDot.className = 'w-2 h-2 rounded-full bg-red-500 shrink-0 transition-colors duration-300'
    setLoading(false)
    return
  }

  // ── Step 2: fetchWeather ───────────────────────────────────────────────────
  logSeparator('fetchWeather')
  const { lat, lon, timezone, name } = geoRes.result
  const weatherRes = await grip.fire('fetchWeather', { lat, lon, timezone }, { locationName: name })
  if (!weatherRes.isSuccess) {
    renderErrorCard($resultCard, weatherRes)
    renderResponses({ geocodeCity: geoRes, fetchWeather: weatherRes })
    $statusDot.className = 'w-2 h-2 rounded-full bg-red-500 shrink-0 transition-colors duration-300'
    setLoading(false)
    return
  }

  // ── Step 3: formatWeather ──────────────────────────────────────────────────
  logSeparator('formatWeather')
  const fmtRes = await grip.fire('formatWeather', { raw: weatherRes.result, location: geoRes.result })
  if (!fmtRes.isSuccess) {
    renderErrorCard($resultCard, fmtRes)
    renderResponses({ geocodeCity: geoRes, fetchWeather: weatherRes, formatWeather: fmtRes })
    $statusDot.className = 'w-2 h-2 rounded-full bg-red-500 shrink-0 transition-colors duration-300'
    setLoading(false)
    return
  }

  renderWeatherCard($resultCard, fmtRes.result)
  renderResponses({ geocodeCity: geoRes, fetchWeather: weatherRes, formatWeather: fmtRes })
  $statusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 shrink-0 transition-colors duration-300'
  setLoading(false)
}

export function initController() {
  $checkBtn.addEventListener('click', onCheck)
  $cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') onCheck() })
}
