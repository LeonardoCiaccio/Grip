import { grip }      from '../grip-instance.js'
import { store, uid } from '../store.js'

export function registerCreatePost() {
  grip.register({
    name: 'createPost',
    validate({ content }) {
      if (!content || typeof content !== 'string' || !content.trim())
        throw new Error('Post content must be a non-empty string.')
    },
    business: async ({ content }, ctx) => {
      const posts = store.getPosts()
      const post  = {
        id:        uid(),
        authorId:  ctx.user.id,
        content:   content.trim(),
        likes:     [],
        comments:  [],
        createdAt: Date.now(),
      }
      posts.unshift(post)
      store.savePosts(posts)
      return post
    },
    assertResult(post) {
      if (!post?.id) throw new Error('Post was not persisted correctly.')
    },
  })
}
