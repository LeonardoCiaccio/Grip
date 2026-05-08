import { grip } from '../grip-instance.js'
import { logEntry } from '../ui/logger.js'

const RULES = [
  { keywords: ['salary', 'payroll', 'wage'],              category: 'salary'        },
  { keywords: ['freelance', 'invoice', 'client'],         category: 'freelance'     },
  { keywords: ['groceries', 'supermarket', 'food', 'restaurant', 'cafe'], category: 'food' },
  { keywords: ['bus', 'train', 'metro', 'taxi', 'uber', 'transport'],     category: 'transport' },
  { keywords: ['doctor', 'pharmacy', 'health', 'hospital', 'medical'],    category: 'health' },
  { keywords: ['netflix', 'spotify', 'cinema', 'game', 'entertainment'],  category: 'entertainment' },
  { keywords: ['electric', 'gas', 'water', 'utility', 'internet', 'phone'], category: 'utilities' },
  { keywords: ['rent', 'lease', 'apartment'],             category: 'rent'          },
]

export function registerCategorizeTransaction() {
  grip.register({
    name: 'categorizeTransaction',
    validate({ description }) {
      if (!description || typeof description !== 'string')
        throw new Error('description must be a non-empty string.')
    },
    business: async ({ description }) => {
      logEntry('business', `auto-categorizing: "${description}"`)
      const lower = description.toLowerCase()
      for (const rule of RULES) {
        if (rule.keywords.some(kw => lower.includes(kw))) {
          logEntry('business', `matched rule → ${rule.category} ✓`)
          return { category: rule.category, matched: true }
        }
      }
      logEntry('business', 'no rule matched → other')
      return { category: 'other', matched: false }
    },
  })
}
