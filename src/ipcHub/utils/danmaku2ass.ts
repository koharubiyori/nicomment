import childProcess from 'child_process'

export interface Danmaku2assOptions {
  screenWidth: number
  screenHeight: number
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
    '-s', options.screenWidth + 'x' + options.screenHeight,
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
