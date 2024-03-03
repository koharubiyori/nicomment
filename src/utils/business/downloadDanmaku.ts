import path from 'path'
import fs from 'fs'
import nicoApi, { GetCommentsOptions } from '~/api/nico'
import nicoCommentsToXml, { NicoCommentsToXmlOptions } from './nicoCommentResponseToXml'
import escapeWindowsFileName from '~/utils/escapeWindowsFileName'
import { CommentsGettingOptions } from '~/pages/home/components/sidePanel'
import dayjs from 'dayjs'

export interface FetchDanmakuOptions {
  savePath: string
  title?: string
  toXmlOptions?: NicoCommentsToXmlOptions
  commentsGettingOptions?: CommentsGettingOptions
}

export interface ResultOfFetchDanmaku {
  success: boolean
  type: 'done' | 'saveFileFailed' | 'downloadFileFailed' | 'incompleteSave'
  videoInfo?: Record<string, any>
  fileContent?: ReturnType<typeof nicoCommentsToXml>
  filePath?: string
  error?: any
  complete?: boolean
}

export default async function fetchDanmaku(id: string, options: FetchDanmakuOptions): Promise<ResultOfFetchDanmaku> {
  try {
    const videoInfo = await nicoApi.getVideoInfo(id)
    const { threads: comments, complete } = await downloadDanmaku(id, options)
    const fileContent = nicoCommentsToXml(comments, options.toXmlOptions)
    const fileDir = options.savePath
    const filePath = path.join(fileDir, escapeWindowsFileName(videoInfo.video.title) + '.xml')

    const isDirExists = await new Promise<boolean>(resolve => fs.access(fileDir, fs.constants.F_OK, err => resolve(!err)))

    // 如果保存目录不存在，创建目录
    if (!isDirExists) {
      await new Promise<void>((resolve, reject) => fs.mkdir(fileDir, { recursive: true }, e => e ? reject(e) : resolve()))
    }

    try {
      await new Promise<void>((resolve, reject) => fs.writeFile(filePath, fileContent.xml, (e) => e ? reject(e) : resolve()))
      return { success: true, type: 'done', videoInfo, fileContent, filePath, complete }
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

function generateGetCommentsOptions(options: FetchDanmakuOptions) {
  let dateForGettingComments = options.commentsGettingOptions?.date
  if (dateForGettingComments && dateForGettingComments.isSame(dayjs(), 'day')) dateForGettingComments = undefined
  const getCommentsOptions: GetCommentsOptions = {
    ...(dateForGettingComments ? { when: Math.floor(dateForGettingComments!.toDate().getTime() / 1000) } : {})
  }

  return getCommentsOptions
}

async function downloadDanmaku(id: string, options: FetchDanmakuOptions): Promise<{ threads: any; complete: boolean }> {
  const videoInfo = await nicoApi.getVideoInfo(id)
  const getCommentsOptions = generateGetCommentsOptions(options)
  const commentsRes = (await nicoApi.getComments(videoInfo, getCommentsOptions)) as any

  const expectingQuantity = options.commentsGettingOptions?.expectingQuantity
  /** 一般结构
   * [
   *    [owner]   投稿者弹幕
   *    [main]    一般弹幕
   *    [easy]    简单弹幕
   *    [main]    不清楚，也是一般弹幕，但时间普遍特别古老，而且数量远远小于另一个main，位置不确定
   * ]
   */
  const threads: any[] = commentsRes.data.threads
  const getMostThread = (threads: any[], type: 'main' | 'easy') => threads
    .filter(item => item.fork === type)
    .toSorted((a, b) => b.commentCount - a.commentCount)[0]
  const mainThread = getMostThread(threads, 'main')
  const easyThread = getMostThread(threads, 'easy')

  const getTotalQuantity = () => threads.reduce<number>((result: number, item: any) => result + item.comments.length, 0)
  // 这里使弹幕达到期待数量的原理是：取弹幕最多的main thread的第一条弹幕作为when参数，从而获取时间稍早的一批弹幕，再将获取弹幕的main和easy与之前的合并
  if (expectingQuantity) {
    const getNextTime = () => new Date(mainThread.comments[0].postedAt).getTime() / 1000

    const delay = () => new Promise<void>(resolve => setTimeout(resolve, 3000))

    while (getTotalQuantity() < expectingQuantity) {
      if (mainThread.comments.length === mainThread.commentCount) return { threads, complete: true }

      await delay()
      try {
        const nextCommentsRes: any = await (async function tryGetComments(failCount) {
          try {
            return nicoApi.getComments(videoInfo, { ...getCommentsOptions, when: getNextTime() })
          } catch(e) {
            if (++failCount > 3) throw e
            await delay()
            return tryGetComments(failCount)
          }
        })(0)

        const nextThreads = nextCommentsRes.data.threads
        const nextMainThreadComments = getMostThread(nextThreads, 'main').comments
        const nextEasyThreadComments = getMostThread(nextThreads, 'easy').comments

        if (nextMainThreadComments.length === 0) return { threads, complete: true }

        mainThread.comments = [].concat(nextMainThreadComments, mainThread.comments)
        // 这里有可能出现重复弹幕，但为了提高性能还是不去重了，因为简单弹幕本身就一堆重复内容
        easyThread.comments = [].concat(nextEasyThreadComments, easyThread.comments)
      } catch(e) {
        console.log('获取弹幕失败次数大于3次，返回未到达弹幕期待值的弹幕集')
        return { threads, complete: false }
      }
    }

    return { threads, complete: true }
  } else {
    return { threads, complete: true }
  }
}
