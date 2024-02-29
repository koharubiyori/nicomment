import { Danmaku2assOptions } from "~/ipcHub/utils/danmaku2ass"
import PlainPrefs from "./utils/plainPrefs"

export interface Danmaku2assConfig extends Danmaku2assOptions {
  ngScore: string
  blockedWords: string
  filters: string,
  autoConvert: boolean,
}

export const defaultDanmaku2assConfig: Danmaku2assConfig = {
  videoWidth: 1920,
  videoHeight: 1080,
  outputPath: '',
  danmakuFont: 'MS PGothic',
  danmakuFontSize: 72,
  danmakuOpacity: 0.8,
  scrollingDanmakuDuration: 13,
  staticDanmakuDuration: 5,
  protectHeight: 0,

  ngScore: '',
  blockedWords: '',
  filters: '',

  autoConvert: false,
}

const _danmaku2assPrefs = new PlainPrefs('danmaku2assPrefs', defaultDanmaku2assConfig)

const danmaku2assPrefs = _danmaku2assPrefs.prefs

export default danmaku2assPrefs
