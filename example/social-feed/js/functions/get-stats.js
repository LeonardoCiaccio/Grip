import { grip }  from '../grip-instance.js'
import { store } from '../store.js'
import { USERS } from '../users.js'

export function registerGetStats() {
  grip.register({
    name: 'getStats',
    validate() {},
    business: async () => {
      const posts  = store.getPosts()
      const dayAgo = Date.now() - 86400000

      const totalLikes    = posts.reduce((s, p) => s + p.likes.length, 0)
      const totalComments = posts.reduce((s, p) => s + p.comments.length, 0)
      const postsToday    = posts.filter(p => p.createdAt >= dayAgo).length

      const counts = {}
      for (const p of posts) counts[p.authorId] = (counts[p.authorId] || 0) + 1
      const topId     = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const topAuthor = topId ? { ...USERS.find(u => u.id === topId), postCount: counts[topId] } : null

      const mostLiked = [...posts].sort((a, b) => b.likes.length - a.likes.length)[0] ?? null

      return {
        totalPosts: posts.length,
        totalLikes,
        totalComments,
        postsToday,
        topAuthor,
        mostLiked: mostLiked
          ? { id: mostLiked.id, content: mostLiked.content.slice(0, 60), likesCount: mostLiked.likes.length }
          : null,
      }
    },
  })
}
