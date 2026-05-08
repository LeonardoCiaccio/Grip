export const USERS = [
  { id: 'alice',   name: 'Alice',   avatar: '👩',   role: 'admin'     },
  { id: 'bob',     name: 'Bob',     avatar: '👨',   role: 'user'      },
  { id: 'charlie', name: 'Charlie', avatar: '🧑',   role: 'user'      },
  { id: 'diana',   name: 'Diana',   avatar: '👩‍💼', role: 'moderator' },
]

const USER_KEY = 'grip_social_user'

export function getCurrentUser() {
  const id = localStorage.getItem(USER_KEY) || 'alice'
  return USERS.find(u => u.id === id) ?? USERS[0]
}

export function setCurrentUser(id) {
  localStorage.setItem(USER_KEY, id)
}
