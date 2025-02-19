import request from 'request'
// import progress from 'request-progress'
import { debugRequest } from './env'
import { requestMsg } from './message'
import { bHh } from './music/options'
// import fs from 'fs'

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}
// var proxyUrl = "http://" + user + ":" + password + "@" + host + ":" + port;
// var proxiedRequest = request.defaults({'proxy': proxyUrl});

/**
 * promise 形式的请求方法
 * @param {*} url
 * @param {*} options
 */
const buildHttpPromose = (url, options) => {
  let requestObj
  let cancelFn
  let p = new Promise((resolve, reject) => {
    cancelFn = reject
    debugRequest && console.log(`\n---send request------${url}------------`)
    requestObj = fetchData(url, options.method, options, (err, resp, body) => {
    // options.isShowProgress && window.api.hideProgress()
      debugRequest && console.log(`\n---response------${url}------------`)
      debugRequest && console.log(JSON.stringify(body))
      requestObj = null
      cancelFn = null
      if (err) {
        // console.log('出错', err.code)
        if (err.code === 'ETIMEDOUT' || err.code == 'ESOCKETTIMEDOUT') {
          const { promise, cancelHttp } = httpFetch(url, options)
          obj.cancelHttp = cancelHttp
          promise.then(resp => resolve(resp)).catch(err => reject(err))
          return
        }
        return reject(err)
      }
      resolve(resp)
    })
  })
  const obj = {
    promise: p,
    cancelHttp() {
      if (!requestObj) return
      cancelFn(new Error(requestMsg.cancelRequest))
      cancelHttp(requestObj)
      requestObj = null
      cancelFn = null
      p = null
    },
  }
  return obj
}

/**
 * 请求超时自动重试
 * @param {*} url
 * @param {*} options
 */
export const httpFetch = (url, options = { method: 'get' }) => {
  const requestObj = buildHttpPromose(url, options)
  requestObj.promise = requestObj.promise.catch(err => {
    if (err.code === 'ETIMEDOUT' || err.code == 'ESOCKETTIMEDOUT') {
      const { promise, cancelHttp } = httpFetch(url, options)
      requestObj.cancelHttp()
      requestObj.cancelHttp = cancelHttp
      return promise
    }
    if (err.message === 'socket hang up') {
      // window.globalObj.apiSource = 'temp'
      return Promise.reject(new Error(requestMsg.unachievable))
    }
    if (err.code === 'ENOTFOUND') return Promise.reject(new Error(requestMsg.notConnectNetwork))
    return Promise.reject(err)
  })
  return requestObj
}

/**
 * 取消请求
 * @param {*} index
 */
export const cancelHttp = requestObj => {
  if (!requestObj) return
  console.log('cancel:', requestObj.href)
  requestObj.abort()
}


/**
 * http 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} cb 回调
 * @return {Number} index 用于取消请求
 */
export const http = (url, options, cb) => {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  // 默认选项
  if (options.method == null) options.method = 'get'

  debugRequest && console.log(`\n---send request------${url}------------`)
  return fetchData(url, options.method, options, (err, resp, body) => {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    cb(err, resp, body)
  })
}

/**
 * http get 请求
 * @param {*} url 地址
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpGet = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    callback(err, resp, body)
  })
}

/**
 * http post 请求
 * @param {*} url 请求地址
 * @param {*} data 提交的数据
 * @param {*} options 选项
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const httpPost = (url, data, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })
  options.data = data

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'post', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    }
    callback(err, resp, body)
  })
}

/**
 * http jsonp 请求
 * @param {*} url 请求地址
 * @param {*} options 选项
 *             options.jsonpCallback 回调
 * @param {*} callback 回调
 * @return {Number} index 用于取消请求
 */
export const http_jsonp = (url, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  let jsonpCallback = 'jsonpCallback'
  if (url.indexOf('?') < 0) url += '?'
  url += `&${options.jsonpCallback}=${jsonpCallback}`

  options.format = 'script'

  // options.isShowProgress && window.api.showProgress({
  //   title: options.progressMsg || '请求中',
  //   modal: true,
  // })

  debugRequest && console.log(`\n---send request-------${url}------------`)
  return fetchData(url, 'get', options, function(err, resp, body) {
    // options.isShowProgress && window.api.hideProgress()
    debugRequest && console.log(`\n---response------${url}------------`)
    debugRequest && console.log(JSON.stringify(body))
    if (err) {
      debugRequest && console.log(JSON.stringify(err))
    } else {
      body = JSON.parse(body.replace(new RegExp(`^${jsonpCallback}\\(({.*})\\)$`), '$1'))
    }

    callback(err, resp, body)
  })
}

const getProxyInfo = () => window.globalObj.proxy.enable
  ? `http://${window.globalObj.proxy.username}:${window.globalObj.proxy.password}@${window.globalObj.proxy.host}:${window.globalObj.proxy.port};`
  : undefined

const fetchData = (url, method, {
  headers = {},
  format = 'json',
  timeout = 15000,
  ...options
}, callback) => {
  // console.log(url, options)
  console.log('---start---', url)
  if (headers[bHh]) {
    let s = Buffer.from(bHh, 'hex').toString()
    s = s.replace(s.substr(-1), '')
    s = Buffer.from(s, 'base64').toString()
    headers[s] = !s || parseInt(process.versions.app.split('.').map(n => n.length < 3 ? n.padStart(3, '0') : n).join(''))
    delete headers[bHh]
  }
  return request(url, {
    ...options,
    method,
    headers: Object.assign({}, defaultHeaders, headers),
    timeout,
    proxy: getProxyInfo(),
    json: format === 'json',
  }, (err, resp, body) => {
    if (err) return callback(err, null)
    callback(null, resp, body)
  })
}
