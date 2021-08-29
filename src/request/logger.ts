import { AfterResponseHook, BeforeRequestHook } from 'got/dist/source'

function reqLog(type: 'request' | 'response', url: string, query: any, body: any, ...more: any[]) {
  const title = type === 'request' ? '发送请求' : '响应请求'
  const bgColor = type === 'request' ? 'green' : 'blueviolet'
  console.group()
    console.debug(`%c${title}%c：${url}`, `background-color: ${bgColor}; color: white`, 'background-color:transparent; color:black')
    body !== undefined && console.debug('请求主体：', body)
    query !== undefined && console.debug('查询参数：', query)
    console.debug(...more)
  console.groupEnd()
}

const requestLogger: BeforeRequestHook = (options) => {
  const url = options.url.hostname + options.url.pathname
  let queryParams: any = {}
  options.url.searchParams.forEach((val, name) => queryParams[name] = val)

  if (options.method === 'POST') {
    reqLog('request', url, options.json, options.body ? JSON.parse(options.body as string) : options.json, options)
  } else {
    reqLog('request', url, queryParams, undefined, options)
  }
}

const responseLogger: AfterResponseHook = (res) => {
  const options = res.request.options
  const url = options.url
  const reqUrl = url.hostname + url.pathname
  let queryParams: any = {}
  url.searchParams.forEach((val, name) => queryParams[name] = val)

  const body = res.headers['content-type']?.split(';')[0] === 'application/json' ? JSON.parse(res.body as any) : res.body
  if (options.method === 'POST') {
    reqLog('response', reqUrl, options.json, queryParams, body, res)
  } else {
    reqLog('response', reqUrl, queryParams, undefined, body, res)
  }

  return res
}

const logger = {
  request: requestLogger,
  response: responseLogger
}

export default logger
