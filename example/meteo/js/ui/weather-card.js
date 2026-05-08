import { escHtml } from './logger.js'

export function renderWeatherCard($el, formatted) {
  const { location, current, daily } = formatted

  const flag = location.countryCode
    ? String.fromCodePoint(...[...location.countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
    : ''

  const forecastDays = daily.map(d =>
    `<div class="flex flex-col items-center gap-1 bg-gray-800/50 rounded-xl p-2">` +
      `<span class="text-[11px] text-gray-500 font-medium">${d.day}</span>` +
      `<span class="text-xl">${d.icon}</span>` +
      `<span class="text-xs font-semibold text-white">${d.tempMax}°</span>` +
      `<span class="text-xs text-gray-600">${d.tempMin}°</span>` +
    `</div>`
  ).join('')

  $el.classList.remove('hidden')
  $el.innerHTML =
    `<div class="space-y-5">` +

      `<div class="flex items-start justify-between gap-4">` +
        `<div>` +
          `<p class="text-gray-400 text-sm font-medium">${flag} ${escHtml(location.name)}, ${escHtml(location.country)}</p>` +
          `<div class="flex items-end gap-3 mt-1">` +
            `<span class="text-6xl font-bold text-white tabular-nums leading-none">${current.temperature}°</span>` +
            `<span class="text-gray-500 text-sm mb-1">Feels like ${current.apparentTemperature}°C</span>` +
          `</div>` +
          `<p class="text-gray-400 text-sm mt-1">${current.description}</p>` +
        `</div>` +
        `<div class="text-6xl leading-none select-none">${current.icon}</div>` +
      `</div>` +

      `<div class="grid grid-cols-2 gap-3">` +
        `<div class="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center gap-3">` +
          `<span class="text-2xl">💧</span>` +
          `<div>` +
            `<p class="text-white font-semibold">${current.humidity}%</p>` +
            `<p class="text-gray-500 text-xs">Humidity</p>` +
          `</div>` +
        `</div>` +
        `<div class="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center gap-3">` +
          `<span class="text-2xl">💨</span>` +
          `<div>` +
            `<p class="text-white font-semibold">${current.windSpeed} km/h</p>` +
            `<p class="text-gray-500 text-xs">Wind</p>` +
          `</div>` +
        `</div>` +
      `</div>` +

      `<div>` +
        `<p class="text-xs text-gray-600 font-medium tracking-wider uppercase mb-2">7-day forecast</p>` +
        `<div class="grid grid-cols-7 gap-1.5">${forecastDays}</div>` +
      `</div>` +

    `</div>`
}

export function renderErrorCard($el, res) {
  const tagColors = {
    GUARD:        'text-amber-400  bg-amber-400/10  border-amber-500/30',
    VALIDATION:   'text-red-400    bg-red-400/10    border-red-500/30',
    BUSINESS:     'text-red-400    bg-red-400/10    border-red-500/30',
    TIMEOUT:      'text-orange-400 bg-orange-400/10 border-orange-500/30',
    ASSERT_RESULT:'text-red-400    bg-red-400/10    border-red-500/30',
  }
  const cls  = tagColors[res.errorType] ?? 'text-red-400 bg-red-400/10 border-red-500/30'
  const body = res.message.replace(/^\w+ \| /, '')

  $el.classList.remove('hidden')
  $el.innerHTML =
    `<div class="flex items-start gap-4">` +
      `<div class="shrink-0 w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">` +
        `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-400">` +
          `<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />` +
        `</svg>` +
      `</div>` +
      `<div class="flex-1 min-w-0">` +
        `<span class="inline-block mono text-xs font-semibold border rounded px-2 py-0.5 ${cls}">${res.errorType}</span>` +
        `<p class="text-gray-200 text-sm mt-2">${escHtml(body)}</p>` +
      `</div>` +
    `</div>`
}
