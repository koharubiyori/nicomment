const zhLanguageMap = {
  keywordSearch: '关键词搜索',
  order: '排序',
  orderTypes: {
    commentMost: '弹幕最多',
    commentLeast: '弹幕最少',
    publishLatest: '最新投稿',
    publishEarliest: '最早投稿',
    viewMost: '最多观看',
    viewLeast: '最少观看',
    commentLatest: '弹幕最近',
    commentEarliest: '弹幕最早',
    mylistMost: '我的列表最多',
    mylistLeast: '我的列表最少',
    durationMost: '时长最长',
    durationLeast: '时长最短',
  },
  duration: '时长',
  durationTypes: {
    none: '不限制',
    '5-': '5分钟以内',
    '5-20': '5分钟~20分钟',
    '20-60': '20分钟~60分钟',
    '60+': '60分钟以上'
  },
  viewCount: '播放数',
  viewCountTypes: {
    none: '不限制',
    '1k-': '1千以内',
    '1k-5k': '1千到5千',
    '5k - 50k': '5千到5万',
    '50k - 100k': '5万到10万',
    '100k - 500k': '10万到50万',
    '500k+': '50万以上'
  }
}

export type LanguageMap = typeof zhLanguageMap

export default zhLanguageMap
