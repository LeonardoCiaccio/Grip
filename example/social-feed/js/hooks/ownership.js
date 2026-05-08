import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function applyOwnership() {
  grip.hook('deletePost', {
    label: 'ownership',
    guard: ({ args }, ctx) => {
      const post = store.getPosts().find(p => p.id === args.postId)
      if (!post) throw new Error('Post not found.')
      if (post.authorId !== ctx.user.id && ctx.user.role === 'user')
        throw new Error('You can only delete your own posts.')
    },
  })

  grip.hook('deleteComment', {
    label: 'ownership',
    guard: ({ args }, ctx) => {
      const post = store.getPosts().find(p => p.id === args.postId)
      if (!post) throw new Error('Post not found.')
      const comment = post.comments.find(c => c.id === args.commentId)
      if (!comment) throw new Error('Comment not found.')
      if (comment.authorId !== ctx.user.id && ctx.user.role === 'user')
        throw new Error('You can only delete your own comments.')
    },
  })
}
