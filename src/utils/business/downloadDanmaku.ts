import path from 'path'
import fs from 'fs'
import nicoApi from '~/api/nico'
import { globalI18n } from '../i18n'
import { notify } from '../notify'
import nicoCommentResponseToXml from './nicoCommentResponseToXml'

export interface DownloadDanmakuOptions {
  savePath: string
  title?: string
  processDanmakuData?: Parameters<typeof nicoCommentResponseToXml>[1]
}

export interface ResultOfDownloadDanmaku {
  success: boolean
  type: 'done' | 'failedSaveFile' | 'failedDownloadFile'
  videoInfo?: Record<string, any>
  fileContent?: ReturnType<typeof nicoCommentResponseToXml>
  error?: any
}

export default async function downloadDanmaku(id: string, options: DownloadDanmakuOptions): Promise<ResultOfDownloadDanmaku> {
  const i18n = globalI18n()

  try {
    const displayTitle = options.title?.replace(/^([\s\S]{15})[\s\S]+$/, '$1...') ?? id
    notify(i18n.startHintOfDownloadComments + displayTitle, ['top', 'right'])

    const videoInfo = await nicoApi.getVideoInfo(id)
    const comments = (await nicoApi.getComments(videoInfo)) as any[]
    const fileContent = nicoCommentResponseToXml(comments, options.processDanmakuData)
    const fileDir = options.savePath
    const filePath = path.join(fileDir, videoInfo.video.title + '.xml')

    const isDirExists = await new Promise<boolean>(resolve => fs.access(fileDir, fs.constants.F_OK, err => resolve(!err)))

    // 如果保存目录不存在，创建目录
    if (!isDirExists) {
      await new Promise<void>((resolve, reject) => fs.mkdir(fileDir, { recursive: true }, e => e ? reject() : resolve()))
    }

    try {
      await new Promise<void>((resolve, reject) => fs.writeFile(filePath, fileContent.xml, (e) => e ? reject() : resolve()))
      return { success: true, type: 'done', videoInfo, fileContent }
    } catch(e) {
      console.log(e)
      return {
        success: false,
        type: 'failedSaveFile',
        error: e
      }
    }
  } catch (e) {
    console.log(e)
    return {
      success: false,
      type: 'failedDownloadFile',
      error: e
    }
  }
}
