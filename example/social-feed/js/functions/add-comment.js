import { grip }      from '../grip-instance.js'
import { store, uid } from '../store.js'

export function registerAddComment() {
  grip.register({
    name: 'addComment',
    validate({ postId, text }) {
      if (!postId || typeof postId !== 'string')
        throw new Error('postId must be a non-empty string.')
      if (!text || typeof text !== 'string' || !text.trim())
        throw new Error('Comment text must be a non-empty string.')
    },
    business: async ({ postId, text }, ctx) => {
      const posts = store.getPosts()
      const post  = posts.find(p => p.id === postId)
      if (!post) throw new Error('Post not found.')

      const comment = {
        id:        uid(),
        authorId:  ctx.user.id,
        text:      text.trim(),
        createdAt: Date.now(),
      }
      post.comments.push(comment)
      store.savePosts(posts)
      return comment
    },
    assertResult(comment) {
      if (!comment?.id) throw new Error('Comment was not persisted correctly.')
    },
  })
}
