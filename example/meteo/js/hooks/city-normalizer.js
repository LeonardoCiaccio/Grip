import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

export function applyCityNormalizer() {
  grip.hook('geocodeCity', {
    before: ({ args }, ctx) => {
      const normalized = args?.city?.trim().replace(/\s+/g, ' ') ?? ''
      ctx.normalizedCity = normalized
      logEntry('before', `city normalized: "${normalized}"`)
    },
    label: 'city-normalizer'
  })
}
