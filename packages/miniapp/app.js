const auth = require('./utils/auth')

App({
  onLaunch() {
    this.relogin = () => auth.login()
    auth.login().catch(() => {})
  },
  globalData: {
    userInfo: null,
    token: null,
  },
})
