import zh, { LanguageMap } from './zh'

const jpLanguageMap: LanguageMap = {
  sequence: '順序',
  search: '検索',
  download: 'ダウンロード',
  settings: '設定',
  mail: 'メールアドレス',
  password: 'パスワード',
  second: '秒',
  minute: '分',
  duration: '再生時間',

  keywordSearch: 'キーワード検索',
  locationOfSave: '保存位置',
  smOrSoCode: 'sm/so ID',
  doSearchPlease: 'まず検索してください',
  viewCounts: '再生数',
  likeCounts: 'いいね！数',
  favoriteCounts: 'マイリスト数',
  commentCounts: 'コメント数',
  publishDate: '投稿日時',
  durationForVideoItem: '再生時間',

  selectLocationOfSave: 'セーブ位置を選択してください',
  emptyKeywordHintForSearch: '検索キーワードは空欄できません',
  emptyLoginInfoHintForSearch: 'ログイン設定は空欄できません',
  emptyCodeHintForSearch: 'sm/so IDは空欄できません',
  tryLoginHint: 'ログインをトライ中...',
  loginSuccessHint: 'ログインしました',
  loginFailHint: 'ログインは失敗しました。ログイン設定とネット環境をチェックしてください',
  startHintOfDownloadComments: 'コメントのダウンロードを開始する：',
  successHintOfDownloadComments: (title: string, total: number) => `コメントを保存しました：${title}，実際的に${total}個を保存しました`,
  failHintOfSaveComments: 'ファイルの保存が失败しました',
  failHintOfDownloadComments: 'コメントのダウンロードが失敗しました',
  basicDateFormatForMoment: 'YYYY年MM月DD日 HH:mm:ss',
  allLoadedHintOfSearchResult: '全部ロードしました',
  emptyHintOfSearchResult: '該当の動画は見つかりませんでした',

  sequenceTypes: {
    commentMost: 'コメントが多い',
    commentLeast: 'コメントが少ない',
    publishLatest: '投稿日時が近い',
    publishEarliest: '投稿日時が遠い',
    viewMost: '再生数が多い',
    viewLeast: '再生数が少ない',
    commentLatest: 'コメント日時が近い',
    commentEarliest: 'コメント日時が遠い',
    mylistMost: 'マイリストが多い',
    mylistLeast: 'マイリストが少ない',
    durationMost: '再生時間が長い',
    durationLeast: '再生時間が短い',
  },
  durationTypes: {
    none: '指定しない',
    '5-': '5分内',
    '5-20': '5分~20分',
    '20-60': '20分~60分',
    '60+': '60分以上'
  },
  viewCountTypes: {
    none: '指定しない',
    '1k-': '1千以内',
    '1k-5k': '1千~5千',
    '5k - 50k': '5千~5万',
    '50k - 100k': '5万~10万',
    '100k - 500k': '10万~50万',
    '500k+': '50万以上'
  },
}

export default jpLanguageMap
