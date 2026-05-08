const STORAGE_KEY = 'grip_social_v1'

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

const SEED = [
  {
    id: 'p1', authorId: 'alice',
    content: 'Just discovered GRIP framework — the interceptor pipeline is absolutely 🔥 Every action flows through guards, validators, and hooks automatically.',
    likes: ['bob', 'charlie', 'diana'], comments: [
      { id: 'c1', authorId: 'bob',   text: 'The hook composition is incredibly clean!',     createdAt: Date.now() - 3000000 },
      { id: 'c2', authorId: 'diana', text: 'Agreed — I set up rate limiting in two lines.', createdAt: Date.now() - 2700000 },
    ], createdAt: Date.now() - 86400000,
  },
  {
    id: 'p2', authorId: 'bob',
    content: 'Built a full auth guard with ownership checks using only GRIP hooks. Zero changes to business logic. 🚀',
    likes: ['alice', 'diana'], comments: [
      { id: 'c3', authorId: 'charlie', text: 'This is the way.', createdAt: Date.now() - 1200000 },
    ], createdAt: Date.now() - 43200000,
  },
  {
    id: 'p3', authorId: 'charlie',
    content: 'The 3D structure map visualizes every hook and pipeline connection in real time. Absolutely blew my mind. 🗺️',
    likes: ['alice'], comments: [], createdAt: Date.now() - 21600000,
  },
  {
    id: 'p4', authorId: 'diana',
    content: 'Content moderation, rate limiting, and ownership checks all live in separate hook files. Separation of concerns is 👌',
    likes: ['alice', 'bob', 'charlie'], comments: [
      { id: 'c4', authorId: 'alice', text: "That's exactly the pattern we were going for!", createdAt: Date.now() - 600000 },
    ], createdAt: Date.now() - 7200000,
  },
]

export const store = {
  getPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : structuredClone(SEED)
    } catch {
      return structuredClone(SEED)
    }
  },
  savePosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY)
    return structuredClone(SEED)
  },
}
