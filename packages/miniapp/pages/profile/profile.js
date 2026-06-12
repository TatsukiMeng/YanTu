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

  onPostTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` })
  },
})
