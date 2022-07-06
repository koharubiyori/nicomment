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
    'Accept-Language': 'ja',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Pragma': 'no-cache',
    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="92"',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
    'Origin': 'https://www.nicovideo.jp',
    'Referer': 'https://www.nicovideo.jp/'
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
  options.headers!['Host'] = (options.url as URL).hostname
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
