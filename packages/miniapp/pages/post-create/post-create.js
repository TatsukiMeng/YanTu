const api = require('../../utils/api')

const CATEGORIES = ['数学', '英语', '政治', '专业课', '经验分享']

Page({
  data: {
    content: '',
    categoryIndex: -1,
    categories: CATEGORIES,
    images: [],
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: e.detail.value })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage() {
    const remaining = 3 - this.data.images.length
    if (remaining <= 0) return
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ images: [...this.data.images, ...newPaths] })
      },
    })
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== idx)
    this.setData({ images })
  },

  async onSubmit() {
    const { content, categoryIndex, categories, images } = this.data
    if (!content.trim()) { wx.showToast({ title: '请输入正文', icon: 'none' }); return }
    if (categoryIndex < 0) { wx.showToast({ title: '请选择分类', icon: 'none' }); return }

    wx.showLoading({ title: '发布中...' })

    // 上传图片
    const uploadedUrls = []
    for (const img of images) {
      try {
        const url = await api.upload(img)
        uploadedUrls.push(url)
      } catch (e) {
        // 上传失败跳过该图
      }
    }

    api.post('/api/posts', {
      content,
      category: categories[categoryIndex],
      images: uploadedUrls,
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        const pages = getCurrentPages()
        const indexPage = pages.find(p => p.route === 'pages/index/index')
        if (indexPage) indexPage._needRefresh = true
        wx.navigateBack()
      }, 1500)
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布失败', icon: 'none' })
    })
  },
})
