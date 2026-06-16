Component({
  properties: {
    post: { type: Object, value: {} },
  },
  methods: {
    onTap() {
      const post = this.properties.post
      if (post && post.id) {
        wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${post.id}` })
      }
    },
    onLikeTap() {
      this.triggerEvent('like', { id: this.properties.post.id })
    },
    onImageTap(e) {
      const { url } = e.currentTarget.dataset
      const images = this.properties.post.images || []
      wx.previewImage({ current: url, urls: images })
    },
  },
})
