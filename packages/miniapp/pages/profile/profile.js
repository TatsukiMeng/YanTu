const api = require('../../utils/api')

Page({
  data: {
    userInfo: null,
    stats: { checkInDays: 0, postCount: 0, commentCount: 0, likeCount: 0 },
    myPosts: [],
    loading: true,
  },

  onShow() {
    this.loadProfile()
  },

  loadProfile() {
    this.setData({ loading: true })
    api.get('/api/user/profile').then(data => {
      this.setData({ userInfo: data.userInfo, stats: data.stats })
      const app = getApp()
      if (app) app.globalData.userInfo = data.userInfo
      this.loadMyPosts()
    }).catch(() => this.setData({ loading: false }))
  },

  loadMyPosts() {
    api.get('/api/user/posts').then(data => {
      this.setData({ myPosts: data.list, loading: false })
    }).catch(() => this.setData({ loading: false }))
  },

  onLike(e) {
    const { id } = e.detail
    api.post(`/api/posts/${id}/like`).then(data => {
      const myPosts = this.data.myPosts.map(p => {
        if (p.id === id) {
          return { ...p, liked_by_me: data.liked, like_count: data.liked ? p.like_count + 1 : p.like_count - 1 }
        }
        return p
      })
      this.setData({ myPosts })
    })
  },
})
