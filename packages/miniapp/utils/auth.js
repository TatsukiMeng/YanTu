const api = require('./api')

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) { reject(new Error('wx.login failed')); return }
        api.post('/api/auth/login', { code: res.code }).then(data => {
          wx.setStorageSync('token', data.token)
          const app = getApp()
          if (app) {
            app.globalData.userInfo = data.userInfo
            app.globalData.token = data.token
          }
          resolve(data.userInfo)
        }).catch(reject)
      },
      fail: reject,
    })
  })
}

function ensureAuth() {
  return new Promise((resolve) => {
    const app = getApp()
    if (app && app.globalData.userInfo && app.globalData.userInfo.nick_name !== '微信用户') {
      resolve(app.globalData.userInfo)
      return
    }
    // 需要授权获取头像昵称
    resolve(null)
  })
}

function updateProfile(nickName, avatarUrl) {
  const app = getApp()
  return api.put('/api/user/profile', {
    nick_name: nickName,
    avatar_url: avatarUrl,
  }).then(data => {
    if (app) app.globalData.userInfo = data
    return data
  })
}

module.exports = { login, ensureAuth, updateProfile }
