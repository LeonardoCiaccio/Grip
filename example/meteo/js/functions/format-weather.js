import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

const WMO_DESCRIPTION = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail',
}

const WMO_ICON = {
  0: '☀️',
  1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️', 77: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  85: '🌨', 86: '❄️',
  95: '⛈', 96: '⛈', 99: '⛈',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function describeCode(code) {
  return WMO_DESCRIPTION[code] ?? 'Unknown'
}

function iconForCode(code) {
  return WMO_ICON[code] ?? '🌡'
}

export function registerFormatWeather() {
  grip.register({
    name: 'formatWeather',

    validate({ raw, location }) {
      logEntry('validate', 'checking raw data structure…')
      if (!raw?.current || !raw?.daily)
        throw new Error('raw must contain current and daily weather data.')
      if (!location?.name)
        throw new Error('location must contain a city name.')
      logEntry('validate', 'raw data structure valid ✓')
    },

    business({ raw, location }) {
      logEntry('business', `formatting weather for ${location.name}…`)

      const c = raw.current
      const current = {
        temperature:         Math.round(c.temperature_2m),
        apparentTemperature: Math.round(c.apparent_temperature),
        humidity:            c.relative_humidity_2m,
        windSpeed:           Math.round(c.wind_speed_10m),
        weatherCode:         c.weather_code,
        description:         describeCode(c.weather_code),
        icon:                iconForCode(c.weather_code),
      }

      const daily = raw.daily.time.map((date, i) => ({
        day:         DAYS[new Date(date).getDay()],
        icon:        iconForCode(raw.daily.weather_code[i]),
        description: describeCode(raw.daily.weather_code[i]),
        tempMax:     Math.round(raw.daily.temperature_2m_max[i]),
        tempMin:     Math.round(raw.daily.temperature_2m_min[i]),
      }))

      logEntry('business', `formatted ${daily.length}-day forecast ✓`)
      return { location, current, daily }
    },

    assertResult(result) {
      logEntry('assertResult', 'verifying formatted output…')
      if (!result?.current?.temperature === undefined)
        throw new Error('Formatted result is missing current temperature.')
      if (!Array.isArray(result?.daily) || result.daily.length === 0)
        throw new Error('Formatted result is missing daily forecast.')
      logEntry('assertResult', 'formatted output valid ✓')
    }
  })
}
