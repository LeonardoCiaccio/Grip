import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

export function registerGeocodeCity() {
  grip.register({
    name: 'geocodeCity',

    validate({ city }) {
      logEntry('validate', 'checking city name…')
      if (!city || typeof city !== 'string' || !city.trim())
        throw new Error('City name must be a non-empty string.')
      if (city.trim().length < 2)
        throw new Error('City name must be at least 2 characters.')
      logEntry('validate', 'city name is valid ✓')
    },

    async business({ city }, ctx) {
      const name = ctx.normalizedCity ?? city
      logEntry('business', `geocoding "${name}"…`)
      const res  = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`)
      if (!res.ok) throw new Error(`Geocoding API error: HTTP ${res.status}.`)
      const data = await res.json()
      if (!data.results?.length) throw new Error(`No results found for "${name}".`)
      const { latitude, longitude, name: cityName, country, country_code, timezone } = data.results[0]
      logEntry('business', `found: ${cityName}, ${country} (${latitude}, ${longitude})`)
      return { lat: latitude, lon: longitude, name: cityName, country, countryCode: country_code, timezone }
    },

    assertResult(result) {
      logEntry('assertResult', 'verifying coordinates…')
      if (typeof result?.lat !== 'number' || typeof result?.lon !== 'number')
        throw new Error('Result must contain numeric lat and lon.')
      if (result.lat < -90 || result.lat > 90 || result.lon < -180 || result.lon > 180)
        throw new Error('Coordinates are out of valid range.')
      logEntry('assertResult', 'coordinates valid ✓')
    }
  })
}
