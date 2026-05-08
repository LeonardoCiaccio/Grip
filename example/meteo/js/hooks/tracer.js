import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

export function applyTracer() {
  grip.hookAll({
    before: ({ name }, ctx) => {
      ctx.startedAt = performance.now()
      logEntry('before', `pipeline started → ${name}`)
    },
    after: ({ name, result }, ctx) => {
      const ms = (performance.now() - ctx.startedAt).toFixed(1)
      if (result?.isSuccess)
        logEntry('after', `${name} completed in ${ms} ms ✓`)
      else
        logEntry('after', `${name} failed [${result?.errorType}] in ${ms} ms`)
    },
    label: 'pipeline-tracer'
  })
}
