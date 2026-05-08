import { escHtml } from './logger.js'

export function renderStats($el, stats) {
  if (!stats) {
    $el.innerHTML = '<p class="text-gray-700 italic text-xs">Loading…</p>'
    return
  }

  const { totalPosts, totalLikes, totalComments, postsToday, topAuthor, mostLiked } = stats

  $el.innerHTML = `
    <div class="space-y-3">

      <div class="grid grid-cols-2 gap-2">
        <div class="bg-gray-800/50 border border-gray-700/40 rounded-xl px-3 py-2.5">
          <p class="text-lg font-bold text-white mono">${totalPosts}</p>
          <p class="text-[11px] text-gray-500 mt-0.5">Total posts</p>
        </div>
        <div class="bg-gray-800/50 border border-gray-700/40 rounded-xl px-3 py-2.5">
          <p class="text-lg font-bold text-white mono">${totalLikes}</p>
          <p class="text-[11px] text-gray-500 mt-0.5">Total likes</p>
        </div>
        <div class="bg-gray-800/50 border border-gray-700/40 rounded-xl px-3 py-2.5">
          <p class="text-lg font-bold text-white mono">${totalComments}</p>
          <p class="text-[11px] text-gray-500 mt-0.5">Comments</p>
        </div>
        <div class="bg-gray-800/50 border border-gray-700/40 rounded-xl px-3 py-2.5">
          <p class="text-lg font-bold text-white mono">${postsToday}</p>
          <p class="text-[11px] text-gray-500 mt-0.5">Today</p>
        </div>
      </div>

      ${topAuthor ? `
        <div class="bg-gray-800/30 border border-gray-700/30 rounded-xl px-3 py-2.5">
          <p class="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1.5">Top author</p>
          <div class="flex items-center gap-2">
            <span class="text-xl">${topAuthor.avatar}</span>
            <div>
              <p class="text-sm font-semibold text-gray-200">${escHtml(topAuthor.name)}</p>
              <p class="text-[11px] text-gray-600">${topAuthor.postCount} post${topAuthor.postCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>` : ''}

      ${mostLiked ? `
        <div class="bg-gray-800/30 border border-gray-700/30 rounded-xl px-3 py-2.5">
          <p class="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-1.5">Most liked ❤️ ${mostLiked.likesCount}</p>
          <p class="text-xs text-gray-400 leading-relaxed">${escHtml(mostLiked.content)}${mostLiked.content.length >= 60 ? '…' : ''}</p>
        </div>` : ''}

    </div>`
}
