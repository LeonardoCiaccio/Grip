import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

export function applyUrlInspector() {
  grip.hook('countDivs', {
    before: ({ args }, ctx) => {
      try {
        ctx.displayHost = new URL(args?.url ?? '').hostname
        logEntry('before', `target host: ${ctx.displayHost}`)
      } catch {
        // invalid URL — validate will surface the error properly
      }
    },
    label: 'url-inspector'
  })
}
