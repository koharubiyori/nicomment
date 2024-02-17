import fsPromise from 'fs/promises'
import path, { join } from 'path'
import { Danmaku2assConfig } from "~/prefs/danmaku2assPrefs"
import { isValidRegExp } from './util'
import { libsIpcClient } from '~/ipcHub/modules/libs'

const temporaryDirName = '.filtered'
const requiredAssGenerationItems: (keyof Danmaku2assConfig)[] = [
  'screenWidth',
  'screenHeight',
  'outputPath',
  'danmakuFont',
  'danmakuFontSize',
  'danmakuOpacity',
  'scrollingDanmakuDuration',
  'staticDanmakuDuration',
  'protectHeight',
]

export interface Danmaku2assWithFiltersOptions extends Danmaku2assConfig {
  isOutputPathOnlyDir: boolean
}

export default class Danmaku2assWithFilters {
  static async convert(inputPath: string, outputPath: string, options: Danmaku2assWithFiltersOptions) {
    const temporaryDirPath = path.join(path.dirname(inputPath), temporaryDirName)
    const rawInputXml = await fsPromise.readFile(inputPath, 'utf8')
    const inputXml = new DOMParser().parseFromString(rawInputXml, 'text/xml')
    const chatNodes = inputXml.firstChild!.childNodes
    let finalInputPath = inputPath
    const chatsToRemove: ChildNode[] = []

    let ngScore = parseInt(options.ngScore)
    if (!isNaN(ngScore) && ngScore !== 0) {
      if (ngScore > 0) ngScore = -ngScore
      chatNodes.forEach((item) => {
        let chatNgScore = parseInt((item as Element).getAttribute('score')!)
        chatNgScore <= ngScore && chatsToRemove.push(item)
      })
    }

    if (options.blockedWords.trim() !== '') {
      const words = options.blockedWords.split(',')
      chatNodes.forEach(item => {
        if (words.some(word => item.textContent?.includes(word))) chatsToRemove.push(item)
      })
    }

    if (options.filters.length !== 0) {
      const filters = options.filters.split('\n').map(item => new RegExp(item))
      chatNodes.forEach(item => filters.some(filter => filter.test(item.textContent!)) && chatsToRemove.push(item))
    }

    // 如果弹幕被过滤了，需要将过滤后的弹幕写入临时文件后再交给danmaku2ass.exe处理
    if (chatsToRemove.length !== 0) {
      chatsToRemove.forEach(item => item.remove())
      const temporaryFilePath = path.join(temporaryDirPath, path.basename(inputPath))
      const xmlString = new XMLSerializer().serializeToString(inputXml)
      await fsPromise.mkdir(path.dirname(temporaryFilePath), { recursive: true })
      await fsPromise.writeFile(temporaryFilePath, xmlString, 'utf8')
      finalInputPath = temporaryFilePath
    }

    let fullOutputPath = outputPath
    if (options.isOutputPathOnlyDir) fullOutputPath = path.join(outputPath, path.basename(inputPath, '.xml') + '.ass')

    await fsPromise.mkdir(options.isOutputPathOnlyDir ? outputPath : path.dirname(outputPath)).catch(console.log)

    await libsIpcClient.danmaku2ass(finalInputPath, fullOutputPath, options)
    if (finalInputPath !== inputPath) fsPromise.rm(temporaryDirPath, { recursive: true })
  }

  static checkIfConfigIsValid(config: Danmaku2assConfig): CheckIfConfigIsValidResult {
    if (Object.entries(config).some(([key, value]) =>
      requiredAssGenerationItems.includes(key as any) &&
      (value === '' || (typeof value === 'number' && isNaN(value))))
    ) return { valid: false, reason: 'hasEmptyItemInAssGeneration' }

    if (config.filters.trim().length !== 0) {
      const filters = config.filters.split('\n')
      const invalidFilterIndex = filters.findIndex(item => !isValidRegExp(item))
      if (invalidFilterIndex !== -1) return {
        valid: false,
        reason: 'invalidRegExp',
        index: invalidFilterIndex,
        pattern: filters[invalidFilterIndex]
      }
    }

    return { valid: true }
  }
}

interface TrueOfCheckingResult {
  valid: true
}

interface HasEmptyOfCheckingResult {
  valid: false
  reason: 'hasEmptyItemInAssGeneration'
}

interface InvalidRegExpOfCheckingResult {
  valid: false
  reason: 'invalidRegExp'
  index: number
  pattern: string
}

type CheckIfConfigIsValidResult = TrueOfCheckingResult | HasEmptyOfCheckingResult | InvalidRegExpOfCheckingResult
