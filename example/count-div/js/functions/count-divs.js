import { grip }     from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

export function registerCountDivs() {
  grip.register({
    name: 'countDivs',

    validate({ url }) {
      logEntry('validate', 'checking URL format…')
      if (!url || typeof url !== 'string' || !url.trim())
        throw new Error('URL must be a non-empty string.')
      try { new URL(url) } catch {
        throw new Error(`"${url}" is not a valid absolute URL.`)
      }
      if (!/^https?:\/\//i.test(url))
        throw new Error('Only http:// and https:// URLs are supported.')
      logEntry('validate', 'URL is valid ✓')
    },

    async business({ url }, ctx) {
      logEntry('business', `fetching → ${new URL(url).hostname}`)
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}.`)
      const html  = await res.text()
      const doc   = new DOMParser().parseFromString(html, 'text/html')
      const count = doc.querySelectorAll('div').length
      ctx.pageTitle = doc.title || null
      logEntry('business', `parsed HTML — found ${count} <div> elements`)
      return { count, title: doc.title || null, url }
    },

    assertResult(result) {
      logEntry('assertResult', 'verifying output contract…')
      if (!result || typeof result !== 'object')
        throw new Error('Result must be a plain object.')
      if (typeof result.count !== 'number' || !Number.isFinite(result.count) || result.count < 0)
        throw new Error('result.count must be a non-negative finite number.')
      logEntry('assertResult', `contract satisfied — count: ${result.count} ✓`)
    }
  })
}
