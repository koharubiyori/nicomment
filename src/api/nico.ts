import { nicoRequest } from '~/request/nico'

export interface NicoSearchOptions {
  q?: string
  targets?: string
  fields: string
  filters?: string
  jsonFilter?: string
  _sort: string
  _offset?: number
  _limit?: number
}

export interface GetCommentsOptions {
  when?: number   // 单位：秒
}

const nicoApi = {
  login(mail: string, password: string): Promise<boolean> {
    return nicoRequest.post('https://account.nicovideo.jp/login/redirector', {
      followRedirect: false,
      headers: {
        'Host': 'account.nicovideo.jp',
        'Origin': 'https://account.nicovideo.jp',
        'Referer': 'https://account.nicovideo.jp/login?site=niconico&next_url=%2F&sec=header_pc&cmnhd_ref=device%3Dpc%26site%3Dniconico%26pos%3Duserpanel%26page%3Dtop',
      },
      searchParams: {
        show_button_twitter: 1,
        site: 'niconico',
        show_button_facebook: 1,
        sec: 'header_pc',
        next_url: '/'
      },
      json: { mail, password }
    })
      .then(res => !res.headers['set-cookie']!.some(item => /^mail_for_retry/.test(item)))
  },

  search(options: NicoSearchOptions) {
    return nicoRequest.get('https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search', {
      searchParams: {
        ...options,
        _context: 'apiguide'
      }
    })
  },

  getVideoInfo(id: string) {
    return nicoRequest.get(`https://www.nicovideo.jp/watch/${id}`)
      .then(res => {
        const pageDocument = document.createElement('div')
        pageDocument.innerHTML = res.body
        const dataEl: any = pageDocument.querySelector('#js-initial-watch-data')
        return JSON.parse(dataEl.dataset.apiData)
      })
  },

  getComments(videoInfo: any, options?: GetCommentsOptions) {
    const {
      server: commentServerBaseUrl,
      params,
      threadKey
    } = videoInfo.comment.nvComment

    return nicoRequest.post(commentServerBaseUrl + '/v1/threads', {
      cookieJar: undefined,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        additionals: options ?? {},
        params,
        threadKey
      })
    }).json()
  }
}

export default nicoApi
