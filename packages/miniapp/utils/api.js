const BASE_URL = 'http://localhost:3000'

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const header = { 'Content-Type': 'application/json' }
    if (token) header['Authorization'] = `Bearer ${token}`

    const opts = {
      url: `${BASE_URL}${path}`,
      method,
      header,
      success(res) {
        if (res.statusCode === 401 && path !== '/api/auth/login') {
          // token 过期，重新登录
          const app = getApp()
          if (app && app.relogin) {
            app.relogin().then(() => {
              request(method, path, data).then(resolve).catch(reject)
            })
          }
          return
        }
        const body = res.data
        if (body && body.code === 0) {
          resolve(body.data)
        } else {
          reject(body)
        }
      },
      fail(err) {
        reject(err)
      },
    }

    if (method === 'GET' && data) {
      const qs = Object.entries(data)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&')
      if (qs) opts.url += `?${qs}`
    } else if (data) {
      opts.data = data
    }

    wx.request(opts)
  })
}

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    wx.uploadFile({
      url: `${BASE_URL}/api/upload`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${token}` },
      success(res) {
        const body = JSON.parse(res.data)
        if (body.code === 0) {
          resolve(body.data.url)
        } else {
          reject(body)
        }
      },
      fail: reject,
    })
  })
}

module.exports = {
  get: (path, params) => request('GET', path, params),
  post: (path, data) => request('POST', path, data),
  put: (path, data) => request('PUT', path, data),
  upload: uploadFile,
}
