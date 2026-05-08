import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

const CURRENT_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'weather_code'
].join(',')

const DAILY_PARAMS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'weather_code'
].join(',')

export function registerFetchWeather() {
  grip.register({
    name: 'fetchWeather',

    validate({ lat, lon, timezone }) {
      logEntry('validate', 'checking coordinates…')
      if (typeof lat !== 'number' || typeof lon !== 'number')
        throw new Error('lat and lon must be numbers.')
      if (lat < -90 || lat > 90)   throw new Error(`Invalid latitude: ${lat}.`)
      if (lon < -180 || lon > 180) throw new Error(`Invalid longitude: ${lon}.`)
      if (!timezone || typeof timezone !== 'string')
        throw new Error('timezone must be a non-empty string.')
      logEntry('validate', 'coordinates valid ✓')
    },

    async business({ lat, lon, timezone }, ctx) {
      logEntry('business', `fetching weather for ${ctx.locationName ?? `${lat}, ${lon}`}…`)
      const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&timezone=${encodeURIComponent(timezone)}&current=${CURRENT_PARAMS}&daily=${DAILY_PARAMS}&forecast_days=7`
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`Weather API error: HTTP ${res.status}.`)
      const data = await res.json()
      logEntry('business', 'weather data received ✓')
      return data
    },

    assertResult(result) {
      logEntry('assertResult', 'verifying weather response…')
      if (!result?.current) throw new Error('Response is missing current weather data.')
      if (!result?.daily)   throw new Error('Response is missing daily forecast data.')
      logEntry('assertResult', 'weather response valid ✓')
    }
  })
}
