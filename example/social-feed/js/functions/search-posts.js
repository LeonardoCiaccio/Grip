import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerSearchPosts() {
  grip.register({
    name: 'searchPosts',
    validate({ query }) {
      if (typeof query !== 'string')
        throw new Error('query must be a string.')
    },
    business: async ({ query }) => {
      const posts = store.getPosts()
      const q     = query.toLowerCase().trim()
      if (!q) return [...posts].sort((a, b) => b.createdAt - a.createdAt)

      return posts
        .filter(p =>
          p.content.toLowerCase().includes(q) ||
          p.authorId.toLowerCase().includes(q) ||
          p.comments.some(c => c.text.toLowerCase().includes(q))
        )
        .sort((a, b) => b.createdAt - a.createdAt)
    },
  })
}
