import { nicoRequest } from '~/request/nico'

export interface NicoSearchOptions {
  q?: string
  target?: string
  fields: string
  filters?: string
  jsonFilter?: string
  _sort: string
  _offset?: string
  _limit?: string
}

export interface GetCommentsOptions {
  ownerComment?: boolean
  easyComment?: boolean
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
      .then(res => res.headers['x-niconico-authflag'] === '0')
  },

  search(options: NicoSearchOptions) {
    return nicoRequest.post('https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search', {
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
    const divider = (content: string) => ({ ping: { content } })
    const userId = videoInfo.viewer.id.toString()
    const userKey = videoInfo.comment.keys.userKey
    const maxMinutes = Math.ceil(videoInfo.video.duration / 60)
    const content = `0-${maxMinutes}:100,1000,nicoru:100`

    const commonData = {
      language: 0,
      nicoru: 3,
      scores: 1,
      user_id: userId,
    }

    const dataItemWrapper = (name: string, number: number, data: any) => [
      divider('ps:' + number),
      { [name]: { ...commonData, ...data } },
      divider('pf:' + number)
    ]

    const dataBlock = (number: number, data: any) => [
      ...dataItemWrapper('thread', number, {
        ...data,
        with_global: 1,
        version: "20090904"
      }),
      ...dataItemWrapper('thread_leaves', number + 1, {
        ...data,
        content
      })
    ]

    const requestData = (videoInfo.comment.threads as any[])
      .filter(item => item.isActive)
      .reduce((result: any[], item: any, index) => {
        return result.concat(dataBlock(index * 2, {
          fork: item.fork,
          thread: item.id,
          ...(item.label === 'default' ? { userKey } : {}),
          ...(item.isThreadkeyRequired ? { threadkey: item.threadkey } : {}),
          ...(item.is184Forced ? { force_184: '1' } : {})
        }))
      }, [])

    return nicoRequest.post('https://nmsg.nicovideo.jp/api.json', {
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify([
        divider('rs:0'),
        ...requestData,
        divider('rf:0')
      ])
    })
      .then(res => {
        const data: any[] = JSON.parse(res.body)
        return data
      })
  }
}

export default nicoApi
