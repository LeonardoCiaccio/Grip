import { escHtml }       from './logger.js'
import { USERS, getCurrentUser } from '../users.js'

function timeAgo(ts) {
  const d = Date.now() - ts
  if (d < 60000)    return 'just now'
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

function getUser(id) {
  return USERS.find(u => u.id === id) ?? { name: id, avatar: '❓', role: 'user' }
}

function roleTag(role) {
  if (role === 'user') return ''
  const cls = role === 'admin'
    ? 'text-rose-400 bg-rose-400/10 border-rose-500/20'
    : 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20'
  return `<span class="text-[10px] mono font-bold ${cls} border px-1.5 py-0.5 rounded">${role}</span>`
}

export function renderFeed($el, posts, { onLike, onDelete, onAddComment, onDeleteComment }) {
  if (!posts.length) {
    $el.innerHTML = '<p class="text-gray-700 italic text-sm text-center py-8">No posts found.</p>'
    return
  }

  const me = getCurrentUser()

  $el.innerHTML = posts.map(post => {
    const author   = getUser(post.authorId)
    const liked    = post.likes.includes(me.id)
    const canDelete = post.authorId === me.id || me.role !== 'user'

    const commentsHtml = post.comments.map(c => {
      const ca  = getUser(c.authorId)
      const canDel = c.authorId === me.id || me.role !== 'user'
      return `
        <div class="flex items-start gap-2 group">
          <span class="text-base shrink-0 mt-0.5">${ca.avatar}</span>
          <div class="flex-1 min-w-0 bg-gray-800/40 rounded-lg px-2.5 py-1.5">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="text-xs font-semibold text-gray-300">${escHtml(ca.name)}</span>
              ${roleTag(ca.role)}
              <span class="text-[11px] text-gray-600">${timeAgo(c.createdAt)}</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed">${escHtml(c.text)}</p>
          </div>
          ${canDel ? `<button class="delete-comment shrink-0 mt-1 opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition" data-post-id="${escHtml(post.id)}" data-comment-id="${escHtml(c.id)}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>` : ''}
        </div>`
    }).join('')

    return `
      <article class="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3" data-post-id="${escHtml(post.id)}">

        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl leading-none">${author.avatar}</span>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-semibold text-gray-200">${escHtml(author.name)}</span>
                ${roleTag(author.role)}
              </div>
              <span class="text-[11px] text-gray-600">${timeAgo(post.createdAt)}</span>
            </div>
          </div>
          ${canDelete ? `
            <button class="delete-post shrink-0 text-gray-700 hover:text-red-400 transition" data-post-id="${escHtml(post.id)}" title="Delete post">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
              </svg>
            </button>` : ''}
        </div>

        <p class="text-gray-200 text-sm leading-relaxed">${escHtml(post.content)}</p>

        <div class="flex items-center gap-4 pt-1 border-t border-gray-800/60">
          <button class="like-btn flex items-center gap-1.5 text-xs font-medium transition ${liked ? 'text-rose-400' : 'text-gray-600 hover:text-rose-400'}" data-post-id="${escHtml(post.id)}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="${liked ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
            </svg>
            ${post.likes.length}
          </button>
          <button class="toggle-comments flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-sky-400 transition" data-post-id="${escHtml(post.id)}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
            </svg>
            ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}
          </button>
        </div>

        <div class="comments-section hidden space-y-2">
          ${commentsHtml ? `<div class="space-y-2">${commentsHtml}</div>` : ''}
          <div class="flex gap-2 pt-1">
            <span class="text-lg shrink-0 leading-none mt-1">${me.avatar}</span>
            <input
              type="text"
              class="comment-input flex-1 mono bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Add a comment… (Enter)"
              data-post-id="${escHtml(post.id)}"
            />
            <button class="submit-comment shrink-0 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition" data-post-id="${escHtml(post.id)}">Post</button>
          </div>
        </div>

      </article>`
  }).join('')

  $el.querySelectorAll('.like-btn').forEach(btn =>
    btn.addEventListener('click', () => onLike(btn.dataset.postId))
  )
  $el.querySelectorAll('.delete-post').forEach(btn =>
    btn.addEventListener('click', () => onDelete(btn.dataset.postId))
  )
  $el.querySelectorAll('.toggle-comments').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.closest('article').querySelector('.comments-section').classList.toggle('hidden')
    })
  )
  $el.querySelectorAll('.submit-comment').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = $el.querySelector(`.comment-input[data-post-id="${btn.dataset.postId}"]`)
      if (inp.value.trim()) onAddComment(btn.dataset.postId, inp.value.trim())
    })
  })
  $el.querySelectorAll('.comment-input').forEach(inp =>
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && inp.value.trim()) onAddComment(inp.dataset.postId, inp.value.trim())
    })
  )
  $el.querySelectorAll('.delete-comment').forEach(btn =>
    btn.addEventListener('click', () => onDeleteComment(btn.dataset.postId, btn.dataset.commentId))
  )
}
