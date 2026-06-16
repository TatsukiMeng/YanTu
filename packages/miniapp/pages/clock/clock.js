const api = require('../../utils/api')

Page({
  data: {
    daysLeft: 0,
    hoursLeft: '00',
    minutesLeft: '00',
    secondsLeft: '00',
    quote: { text: '', author: '' },
    checkedToday: false,
    streak: 0,
    monthChecked: 0,
    todayDate: 0,
    rate: 0,
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    calendar: [], // [{ day, date, checked, isToday, isFuture }]
  },

  _timer: null,
  _examTarget: null,

  onShow() {
    this._computeExamDate()
    this._tickCountdown()
    this._timer = setInterval(() => this._tickCountdown(), 1000)
    this.loadQuote()
    this.loadStats()
    this.loadCalendar()
    this.checkToday()
  },

  onHide() {
    if (this._timer) clearInterval(this._timer)
  },
  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  _computeExamDate() {
    // 中国考研：当年12月倒数第二个周六（简化版）
    const now = new Date()
    const year = now.getFullYear()
    const findExamSat = (y: number) => {
      const dec31 = new Date(y, 11, 31)
      let lastSat = dec31
      while (lastSat.getDay() !== 6) lastSat.setDate(lastSat.getDate() - 1)
      const exam = new Date(lastSat)
      exam.setDate(exam.getDate() - 7)
      exam.setHours(0, 0, 0, 0)
      return exam
    }
    let target = findExamSat(year)
    if (target.getTime() < now.getTime()) target = findExamSat(year + 1)
    this._examTarget = target
  },

  _tickCountdown() {
    if (!this._examTarget) return
    const diff = this._examTarget.getTime() - Date.now()
    if (diff <= 0) {
      this.setData({ daysLeft: 0, hoursLeft: '00', minutesLeft: '00', secondsLeft: '00' })
      return
    }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    this.setData({
      daysLeft: days,
      hoursLeft: String(hours).padStart(2, '0'),
      minutesLeft: String(minutes).padStart(2, '0'),
      secondsLeft: String(seconds).padStart(2, '0'),
    })
  },

  loadQuote() {
    api.get('/api/quotes/random').then(data => {
      this.setData({ quote: data })
    })
  },

  loadStats() {
    api.get('/api/checkin/streak').then(data => {
      this.setData({
        streak: data.streak,
        monthChecked: data.monthChecked,
        todayDate: data.todayDate,
        rate: data.rate,
      })
    })
  },

  loadCalendar() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    api.get('/api/checkin/calendar', { month: monthStr }).then(data => {
      const checkedSet = new Set(data.dates)
      // 当月第一天是周几（0=周日 → 转成周一为起点的偏移）
      const firstDay = new Date(year, month, 1)
      let firstWeekday = firstDay.getDay() - 1 // 周一=0
      if (firstWeekday < 0) firstWeekday = 6 // 周日=6
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const today = now.getDate()
      const toLocalDate = (d: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

      const cells: any[] = []
      // 前置占位
      for (let i = 0; i < firstWeekday; i++) cells.push({ day: '', placeholder: true })
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = toLocalDate(d)
        cells.push({
          day: d,
          date: dateStr,
          checked: checkedSet.has(dateStr),
          isToday: d === today,
          isFuture: d > today,
        })
      }
      // 后置补齐到 7 的倍数（视觉对齐）
      while (cells.length % 7 !== 0) cells.push({ day: '', placeholder: true })

      this.setData({ calendar: cells })
    })
  },

  checkToday() {
    const cachedDate = wx.getStorageSync('checkedDate')
    const today = new Date().toISOString().slice(0, 10)
    if (cachedDate === today) {
      this.setData({ checkedToday: true })
    }
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
      wx.vibrateShort && wx.vibrateShort({ type: 'medium' })
      wx.showToast({ title: '打卡成功！', icon: 'success' })
      this.loadStats()
      this.loadCalendar()
    })
  },
})
