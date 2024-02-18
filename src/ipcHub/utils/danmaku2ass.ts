import childProcess from 'child_process'

export interface Danmaku2assOptions {
  videoWidth: number
  videoHeight: number
  outputPath: string
  danmakuFont: string
  danmakuFontSize: number
  danmakuOpacity: number
  scrollingDanmakuDuration: number
  staticDanmakuDuration: number
  protectHeight: number
}

export default function danmaku2ass(inputPath: string, outputPath: string, options: Danmaku2assOptions) {
  const safety = (str: string) => '"' + str + '"'

  const params = [
    '-o', safety(outputPath),
    '-s', options.videoWidth + 'x' + options.videoHeight,
    '-fn', safety(options.danmakuFont),
    '-fs', options.danmakuFontSize,
    '-a', options.danmakuOpacity,
    '-dm', options.scrollingDanmakuDuration,
    '-ds', options.staticDanmakuDuration,
    '-p', options.protectHeight,
    safety(inputPath)
  ]

  return new Promise<void>((resolve) => {
    childProcess.exec(`libs\\danmaku2ass.exe ${params.join(' ')}`, err => {
      if (err !== null) throw err
      resolve()
    })
  })
}
