import { grip } from '../grip-instance.js'

const BANNED     = ['spam', 'hate', 'toxic', 'nsfw', 'abuse']
const MIN_LENGTH = 3
const MAX_LENGTH = 500

function moderate(text, label) {
  const trimmed = text?.trim() ?? ''
  if (trimmed.length < MIN_LENGTH)
    throw new Error(`${label} is too short (minimum ${MIN_LENGTH} characters)`)
  if (trimmed.length > MAX_LENGTH)
    throw new Error(`${label} is too long (maximum ${MAX_LENGTH} characters)`)
  const lower = trimmed.toLowerCase()
  for (const word of BANNED) {
    if (lower.includes(word))
      throw new Error(`Content flagged by moderator: "${word}" is not allowed`)
  }
}

export function applyContentModerator() {
  grip.hook('createPost', {
    label: 'content-moderator',
    guard: ({ args }) => moderate(args.content, 'Post'),
  })
  grip.hook('addComment', {
    label: 'content-moderator',
    guard: ({ args }) => moderate(args.text, 'Comment'),
  })
}
