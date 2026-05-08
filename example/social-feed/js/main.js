import { registerLoadFeed }      from './functions/load-feed.js'
import { registerCreatePost }    from './functions/create-post.js'
import { registerDeletePost }    from './functions/delete-post.js'
import { registerLikePost }      from './functions/like-post.js'
import { registerAddComment }    from './functions/add-comment.js'
import { registerDeleteComment } from './functions/delete-comment.js'
import { registerSearchPosts }   from './functions/search-posts.js'
import { registerGetStats }      from './functions/get-stats.js'

import { applyTracer }           from './hooks/tracer.js'
import { applyAuthGuard }        from './hooks/auth-guard.js'
import { applyRateLimiter }      from './hooks/rate-limiter.js'
import { applyContentModerator } from './hooks/content-moderator.js'
import { applyOwnership }        from './hooks/ownership.js'

import { initController }            from './ui/controller.js'
import { openGripMap, closeGripMap } from './ui/grip-graph.js'

// ── Register functions ────────────────────────────────────────────────────────
registerLoadFeed()
registerCreatePost()
registerDeletePost()
registerLikePost()
registerAddComment()
registerDeleteComment()
registerSearchPosts()
registerGetStats()

// ── Apply hooks ───────────────────────────────────────────────────────────────
applyTracer()
applyAuthGuard()
applyRateLimiter()
applyContentModerator()
applyOwnership()

// ── Start UI ──────────────────────────────────────────────────────────────────
initController()

document.getElementById('mapBtn').addEventListener('click', openGripMap)
document.getElementById('closeMapBtn').addEventListener('click', closeGripMap)
document.getElementById('modalBackdrop').addEventListener('click', closeGripMap)
