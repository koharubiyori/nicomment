import path from 'path'
import fs from 'fs'
import nicoApi from '~/api/nico'
import { globalI18n } from '../i18n'
import { notify } from '../notify'
import nicoCommentResponseToXml from './nicoCommentResponseToXml'
import escapeWindowsFileName from '~/utils/escapeWindowsFileName'

export interface DownloadDanmakuOptions {
  savePath: string
  title?: string
  processDanmakuData?: Parameters<typeof nicoCommentResponseToXml>[1]
}

export interface ResultOfDownloadDanmaku {
  success: boolean
  type: 'done' | 'saveFileFailed' | 'downloadFileFailed'
  videoInfo?: Record<string, any>
  fileContent?: ReturnType<typeof nicoCommentResponseToXml>
  error?: any
}

export default async function downloadDanmaku(id: string, options: DownloadDanmakuOptions): Promise<ResultOfDownloadDanmaku> {
  try {
    const videoInfo = await nicoApi.getVideoInfo(id)
    const comments = (await nicoApi.getComments(videoInfo)) as any[]
    const fileContent = nicoCommentResponseToXml(comments, options.processDanmakuData)
    const fileDir = options.savePath
    const filePath = path.join(fileDir, escapeWindowsFileName(videoInfo.video.title) + '.xml')

    const isDirExists = await new Promise<boolean>(resolve => fs.access(fileDir, fs.constants.F_OK, err => resolve(!err)))

    // 如果保存目录不存在，创建目录
    if (!isDirExists) {
      await new Promise<void>((resolve, reject) => fs.mkdir(fileDir, { recursive: true }, e => e ? reject(e) : resolve()))
    }

    try {
      await new Promise<void>((resolve, reject) => fs.writeFile(filePath, fileContent.xml, (e) => e ? reject(e) : resolve()))
      return { success: true, type: 'done', videoInfo, fileContent }
    } catch(e) {
      console.log(e)
      return {
        success: false,
        type: 'saveFileFailed',
        error: e
      }
    }
  } catch (e) {
    console.log(e)
    return {
      success: false,
      type: 'downloadFileFailed',
      error: e
    }
  }
}
