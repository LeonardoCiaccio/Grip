import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerLikePost() {
  grip.register({
    name: 'likePost',
    validate({ postId }) {
      if (!postId || typeof postId !== 'string')
        throw new Error('postId must be a non-empty string.')
    },
    business: async ({ postId }, ctx) => {
      const posts  = store.getPosts()
      const post   = posts.find(p => p.id === postId)
      if (!post) throw new Error('Post not found.')

      const userId = ctx.user.id
      const idx    = post.likes.indexOf(userId)
      if (idx === -1) post.likes.push(userId)
      else            post.likes.splice(idx, 1)

      store.savePosts(posts)
      return { postId, liked: idx === -1, likesCount: post.likes.length }
    },
  })
}
