const api = require('../../utils/api')

Page({
  data: {
    daysLeft: 0,
    quote: { text: '', author: '' },
    checkedToday: false,
  },

  onShow() {
    this.calcCountdown()
    this.loadQuote()
    this.checkToday()
  },

  calcCountdown() {
    const now = new Date()
    const year = now.getFullYear()
    // 当年12月倒数第二个周六
    const dec31 = new Date(year, 11, 31)
    let lastSat = dec31
    while (lastSat.getDay() !== 6) lastSat.setDate(lastSat.getDate() - 1)
    const examDate = new Date(lastSat)
    examDate.setDate(examDate.getDate() - 7)
    // 如果已过，用下一年
    let target = examDate < now ? new Date(year + 1, 11, 31) : examDate
    if (target < now) {
      while (target.getDay() !== 6) target.setDate(target.getDate() - 1)
      const nextExam = new Date(target)
      nextExam.setDate(nextExam.getDate() - 7)
      target = nextExam
    }
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
    this.setData({ daysLeft: diff })
  },

  loadQuote() {
    api.get('/api/quotes/random').then(data => {
      this.setData({ quote: data })
    })
  },

  checkToday() {
    // Storage 缓存优先
    const cachedDate = wx.getStorageSync('checkedDate')
    const today = new Date().toISOString().slice(0, 10)
    if (cachedDate === today) {
      this.setData({ checkedToday: true })
    }
    // API 核对
    api.get('/api/checkin/today').then(data => {
      if (data.checked) {
        this.setData({ checkedToday: true })
        wx.setStorageSync('checkedDate', today)
      }
    })
  },

  onCheckIn() {
    if (this.data.checkedToday) {
      wx.showToast({ title: '今天已经打过卡啦！', icon: 'none' })
      return
    }
    api.post('/api/checkin').then(() => {
      const today = new Date().toISOString().slice(0, 10)
      wx.setStorageSync('checkedDate', today)
      this.setData({ checkedToday: true })
      wx.showToast({ title: '打卡成功！', icon: 'success' })
    })
  },
})
