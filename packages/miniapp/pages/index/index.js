const api = require('../../utils/api')

Page({
  data: {
    tabs: ['全部', '数学', '英语', '政治', '专业课', '经验分享'],
    currentTab: 0,
    posts: [],
    page: 1,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadPosts()
  },

  onShow() {
    if (this._needRefresh) {
      this._needRefresh = false
      this.setData({ posts: [], page: 1, hasMore: true })
      this.loadPosts()
    }
  },

  onTabChange(e) {
    const idx = e.currentTarget.dataset.index
    if (idx === this.data.currentTab) return
    this.setData({ currentTab: idx, posts: [], page: 1, hasMore: true })
    this.loadPosts()
  },

  loadPosts() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })
    const category = this.data.tabs[this.data.currentTab]
    api.get('/api/posts', {
      category: category === '全部' ? '' : category,
      page: this.data.page,
      limit: 10,
    }).then(data => {
      this.setData({
        posts: [...this.data.posts, ...data.list],
        hasMore: this.data.posts.length + data.list.length < data.total,
        page: this.data.page + 1,
        loading: false,
      })
    }).catch(() => this.setData({ loading: false }))
  },

  onReachBottom() {
    this.loadPosts()
  },

  onLike(e) {
    const { id } = e.detail
    api.post(`/api/posts/${id}/like`).then(data => {
      const posts = this.data.posts.map(p => {
        if (p.id === id) {
          return { ...p, liked_by_me: data.liked, like_count: data.liked ? p.like_count + 1 : p.like_count - 1 }
        }
        return p
      })
      this.setData({ posts })
    })
  },

  onFabTap() {
    wx.navigateTo({ url: '/pages/post-create/post-create' })
  },
})
