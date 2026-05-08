import { grip }  from '../grip-instance.js'
import { store } from '../store.js'

export function registerLoadFeed() {
  grip.register({
    name: 'loadFeed',
    validate() {},
    business: async () => {
      const posts = store.getPosts()
      return [...posts].sort((a, b) => b.createdAt - a.createdAt)
    },
  })
}
