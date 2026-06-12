const api = require('../../utils/api')

Page({
  data: {
    post: null,
    comments: [],
    commentText: '',
  },

  onLoad(options) {
    this.postId = options.id
    this.loadPost()
    this.loadComments()
  },

  loadPost() {
    api.get(`/api/posts/${this.postId}`).then(post => {
      this.setData({ post })
    })
  },

  loadComments() {
    api.get(`/api/posts/${this.postId}/comments`).then(data => {
      this.setData({ comments: data.list })
    })
  },

  onLikeTap() {
    api.post(`/api/posts/${this.postId}/like`).then(data => {
      const post = this.data.post
      this.setData({
        'post.liked_by_me': data.liked,
        'post.like_count': data.liked ? post.like_count + 1 : post.like_count - 1,
      })
    })
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  onSubmitComment() {
    const content = this.data.commentText.trim()
    if (!content) { wx.showToast({ title: '请输入评论内容', icon: 'none' }); return }

    api.post(`/api/posts/${this.postId}/comments`, { content }).then(() => {
      this.setData({ commentText: '' })
      this.loadComments()
      wx.showToast({ title: '评论成功', icon: 'success' })
    })
  },

  onImageTap(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({ current: url, urls: this.data.post.images })
  },
})
