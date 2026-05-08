import { grip }                              from '../grip-instance.js'
import { getCurrentUser, setCurrentUser, USERS } from '../users.js'
import { clearLog, logEntry, logSeparator }      from './logger.js'
import { renderFeed }                            from './feed.js'
import { renderStats }                           from './stats.js'

const $feed         = document.getElementById('feedList')
const $composer     = document.getElementById('composerInput')
const $postBtn      = document.getElementById('postBtn')
const $searchInput  = document.getElementById('searchInput')
const $statsContent = document.getElementById('statsContent')
const $statusDot    = document.getElementById('statusDot')
const $errorToast   = document.getElementById('errorToast')
const $errorMsg     = document.getElementById('errorMsg')
const $composerAvatar = document.getElementById('composerAvatar')

let toastTimer = null

function showError(message) {
  $errorMsg.textContent = message
  $errorToast.classList.remove('hidden', 'opacity-0')
  $errorToast.classList.add('opacity-100')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    $errorToast.classList.add('opacity-0')
    setTimeout(() => $errorToast.classList.add('hidden'), 300)
  }, 4500)
}

function setStatus(state) {
  const map = {
    idle:    'w-2 h-2 rounded-full bg-gray-700 shrink-0 transition-colors duration-300',
    loading: 'w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 transition-colors duration-300',
    success: 'w-2 h-2 rounded-full bg-emerald-500 shrink-0 transition-colors duration-300',
    error:   'w-2 h-2 rounded-full bg-red-500 shrink-0 transition-colors duration-300',
  }
  $statusDot.className = map[state] ?? map.idle
}

function ctx() {
  return { user: getCurrentUser() }
}

async function refreshFeed(query = '') {
  setStatus('loading')
  const fn  = query ? 'searchPosts' : 'loadFeed'
  const res = await grip.fire(fn, query ? { query } : {}, ctx())
  if (res.isSuccess) {
    renderFeed($feed, res.result, { onLike, onDelete, onAddComment, onDeleteComment })
    setStatus('success')
  } else {
    showError(res.message)
    setStatus('error')
  }
}

async function refreshStats() {
  const res = await grip.fire('getStats', {}, ctx())
  if (res.isSuccess) renderStats($statsContent, res.result)
}

async function onLike(postId) {
  logSeparator('likePost')
  const res = await grip.fire('likePost', { postId }, ctx())
  if (!res.isSuccess) { showError(res.message); return }
  await refreshFeed($searchInput.value.trim())
  await refreshStats()
}

async function onDelete(postId) {
  logSeparator('deletePost')
  const res = await grip.fire('deletePost', { postId }, ctx())
  if (!res.isSuccess) { showError(res.message); return }
  await refreshFeed($searchInput.value.trim())
  await refreshStats()
}

async function onAddComment(postId, text) {
  logSeparator('addComment')
  const res = await grip.fire('addComment', { postId, text }, ctx())
  if (!res.isSuccess) { showError(res.message); return }
  await refreshFeed($searchInput.value.trim())
}

async function onDeleteComment(postId, commentId) {
  logSeparator('deleteComment')
  const res = await grip.fire('deleteComment', { postId, commentId }, ctx())
  if (!res.isSuccess) { showError(res.message); return }
  await refreshFeed($searchInput.value.trim())
}

async function onPost() {
  const content = $composer.value.trim()
  if (!content) return
  logSeparator('createPost')
  $postBtn.disabled = true
  const res = await grip.fire('createPost', { content }, ctx())
  $postBtn.disabled = false
  if (!res.isSuccess) { showError(res.message); return }
  $composer.value = ''
  await refreshFeed()
  await refreshStats()
}

function updateUserUI() {
  const current = getCurrentUser()
  $composerAvatar.textContent = current.avatar
  document.querySelectorAll('[data-user-id]').forEach(btn => {
    const active = btn.dataset.userId === current.id
    btn.className = active
      ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white transition-all select-none'
      : 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 transition-all select-none'
  })
}

export function initController() {
  $postBtn.addEventListener('click', onPost)
  $composer.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onPost()
  })

  let searchTimer
  $searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      clearLog()
      logSeparator($searchInput.value.trim() ? 'searchPosts' : 'loadFeed')
      refreshFeed($searchInput.value.trim())
    }, 300)
  })

  document.querySelectorAll('[data-user-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      setCurrentUser(btn.dataset.userId)
      updateUserUI()
      clearLog()
      logSeparator('loadFeed')
      refreshFeed().then(() => refreshStats())
    })
  })

  updateUserUI()
  clearLog()
  logSeparator('loadFeed')
  refreshFeed().then(() => refreshStats())
}
