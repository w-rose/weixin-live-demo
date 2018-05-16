const host = 'http://127.0.0.1:5000/'
const wxRequest = (params) => {
  wx.showToast({
    title: '加载中',
    icon: 'loading'
  })
  wx.request({
    url: host + params.url,
    method: params.method || 'GET',
    data: params.data || {},
    header: params.headers || {
      'content-type': 'application/x-www-form-urlencoded'
    },
    success: (res) => {
      params.success && params.success(res)
      wx.hideToast()
    },
    fail: (res) => {
      params.fail && params.fail(res)
    },
    complete: (res) => {
      params.complete && params.complete(res)
    }
  })
}

const api = (options) => wxRequest(options)

const file = (options) => wxRequest(options)

module.exports = {
  api,
  file
}
