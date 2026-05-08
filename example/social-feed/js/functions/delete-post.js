import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerDeletePost() {
  grip.register({
    name: 'deletePost',
    validate({ postId }) {
      if (!postId || typeof postId !== 'string')
        throw new Error('postId must be a non-empty string.')
    },
    business: async ({ postId }) => {
      const posts = store.getPosts()
      const idx   = posts.findIndex(p => p.id === postId)
      if (idx === -1) throw new Error('Post not found.')
      const [removed] = posts.splice(idx, 1)
      store.savePosts(posts)
      return { deleted: removed.id }
    },
  })
}
