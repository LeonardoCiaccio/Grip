import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerDeleteComment() {
  grip.register({
    name: 'deleteComment',
    validate({ postId, commentId }) {
      if (!postId    || typeof postId    !== 'string') throw new Error('postId must be a non-empty string.')
      if (!commentId || typeof commentId !== 'string') throw new Error('commentId must be a non-empty string.')
    },
    business: async ({ postId, commentId }) => {
      const posts = store.getPosts()
      const post  = posts.find(p => p.id === postId)
      if (!post) throw new Error('Post not found.')

      const idx = post.comments.findIndex(c => c.id === commentId)
      if (idx === -1) throw new Error('Comment not found.')

      const [removed] = post.comments.splice(idx, 1)
      store.savePosts(posts)
      return { deleted: removed.id }
    },
  })
}
