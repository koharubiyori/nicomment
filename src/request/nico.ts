import got, { Options, RequestError } from 'got'
import { CookieJar } from 'tough-cookie'
import settingsPrefs from '~/prefs/settingsPrefs'
import { globalI18n } from '~/utils/i18n'
import { notify } from './../utils/notify'
import createProxyAgent from './createProxyAgent'
import logger from './logger'

const nicoCookieJar = new CookieJar()

export const nicoRequest = got.extend({
  cookieJar: nicoCookieJar,
  timeout: 7_000,
  headers: {
    'Accept': '*/*',
    'Connection': 'keep-alive',
    'DNT': '1',
    // 'Host': 'nv-comment.nicovideo.jp',
    'Origin': 'https://www.nicovideo.jp',
    'Referer': 'https://www.nicovideo.jp/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'x-client-os-type': 'others',
    'x-frontend-id': '6',
    'x-frontend-version': '0',
  },

  hooks: {
    beforeRequest: [addHostToHeaders, addProxyAgent, logger.request],
    afterResponse: [logger.response],
    beforeError: [errorHook]
  }
})

function errorHook(error: RequestError) {
  notify.error(globalI18n().netErr)
  return error
}

function addHostToHeaders(options: Options) {
  options.headers!['Host'] = (options.url as unknown as URL).hostname
}

function addProxyAgent(options: Options) {
  if (settingsPrefs.proxy.type !== 'direct') {
    const hostname = settingsPrefs.proxy.hostname.replace(/:\d+$/, '')
    let port: any = settingsPrefs.proxy.hostname.match(/:(\d+)/)?.[1]
    if (port !== undefined) port = parseInt(port)
    if (isNaN(port)) port = undefined

    options.agent = createProxyAgent({
      ...settingsPrefs.proxy,
      hostname,
      port
    })
  }
}
