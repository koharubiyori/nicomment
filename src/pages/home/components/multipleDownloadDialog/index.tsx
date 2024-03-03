import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core'
import React, { MutableRefObject, PropsWithChildren, useMemo, useRef, useState } from 'react'
import { useI18n } from '~/utils/i18n'
import fetchDanmaku, { ResultOfFetchDanmaku } from '~/utils/business/downloadDanmaku'
import classes from './index.scss'
import CssVariablesOfTheme from '~/components/cssVariablesOfTheme'
import { showDanmaku2assModal } from '~/pages/danmaku2assModal'
import { CommentsGettingOptions } from '../sidePanel'

export interface Props {
  getRef: MutableRefObject<any>
}

export interface ShowMultipleDownloadOptions {
  videoList: VideoItem[]
  pathOfSave: string
  commentsGettingOptions?: CommentsGettingOptions
}

export interface MultipleSelectDialogRef {
  show(options: ShowMultipleDownloadOptions): void
}

function MultipleSelectDialog(props: PropsWithChildren<Props>) {
  const i18n = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [videoList, setVideoList] = useState<VideoItemWithDownload[]>([])
  const configsRef = useRef<Omit<ShowMultipleDownloadOptions, 'videoList'>>(null as any)
  const abortFlag = useRef(false)

  const totalStatus = useMemo<DownloadStatus>(() => {
    if (videoList.some(item => item.status === 'downloading')) return 'downloading'
    if (videoList.some(item => item.status === 'error')) return 'error'
    return 'completed'
  }, [videoList])

  if (props.getRef) props.getRef.current = {
    show: ({ videoList, pathOfSave, commentsGettingOptions }) => {
      setIsOpen(true)
      configsRef.current = { pathOfSave, commentsGettingOptions }
      const formattedVideoList = videoList.map(item => ({ ...item, status: 'waiting' as DownloadStatus }))
      setVideoList(formattedVideoList)
      startDownload(formattedVideoList)
    }
  } as MultipleSelectDialogRef

  async function startDownload(videos = videoList) {
    abortFlag.current = false
    setVideoList(prevVal => {
      const workingVideoIds = videos.map(item => item.id)
      prevVal
        .filter(item => workingVideoIds.includes(item.id))
        .forEach(item => item.status = 'waiting')
      return prevVal.concat([])
    })

    for (let item of videos) {
      if (abortFlag.current) break

      setVideoList(prevVal => {
        prevVal.find(prevValItem => prevValItem.id === item.id)!.status = 'downloading'
        return prevVal.concat([])
      })

      const result = await fetchDanmaku(item.id, {
        title: item.title,
        savePath: configsRef.current!.pathOfSave,
        commentsGettingOptions: configsRef.current.commentsGettingOptions
      })

      if (abortFlag.current) break

      setVideoList(prevVal => {
        const targetVideo = prevVal.find(prevValItem => prevValItem.id === item.id)!
        targetVideo.status = result.success ? 'completed' : 'error'
        targetVideo.result = result
        targetVideo.resultText = ({
          done: () => i18n.successHintOfDownloadCommentsShort(result.fileContent!.commentTotal),
          incompleteSave: () => '',
          saveFileFailed: () => i18n.failHintOfSaveComments,
          downloadFileFailed: () => i18n.failHintOfDownloadComments,
        }[result.type])()

        return prevVal.concat([])
      })
    }
  }

  function toConvertDownloadedComments() {
    const downloadedItemPaths = videoList
      .filter(item => item.status === 'completed')
      .map(item => item.result!.filePath!)

    showDanmaku2assModal(downloadedItemPaths)
    setIsOpen(false)
  }

  function retryFailedDownloads() {
    const filedDownloads = videoList.filter(item => item.status === 'error')
    startDownload(filedDownloads)
  }

  function closeAndAbortDownload() {
    setIsOpen(false)
    abortFlag.current = true
  }

  const statusMapToText = (status: DownloadStatus) => ({
    waiting: i18n.waitForDownload,
    downloading: i18n.downloading,
    completed: i18n.completed,
    error: i18n.error
  })[status]

  return (
    <Dialog
      open={isOpen}
      maxWidth={false}
      onClose={() => setIsOpen(false)}
    >
      <CssVariablesOfTheme>
        <DialogTitle>{i18n.multipleDownload}</DialogTitle>
        <DialogContent>
          <TableContainer variant="outlined" component={Paper} style={{ maxHeight: 387, width: 'auto' }}>
            <Table stickyHeader className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">{i18n.thumbnail}</TableCell>
                  <TableCell align="center">{i18n.title}</TableCell>
                  <TableCell align="center">{i18n.status}</TableCell>
                  <TableCell align="center">{i18n.result}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {videoList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell align="center">
                      <img
                        width={130}
                        height={100}
                        src={item.thumbnail}
                      />
                    </TableCell>
                    <TableCell align="center" style={{ width: '20em' }}>{item.title}</TableCell>
                    <TableCell align="center" style={{ width: '7em' }} className={classes.statusText} data-status={item.status}>{statusMapToText(item.status)}</TableCell>
                    <TableCell align="center" style={{ width: '20em' }}>{item.resultText ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <div className="flex-row flex-between">
            <div style={{ marginLeft: 15 }}>
              <Button
                color="primary"
                disabled={videoList.some(item => ['downloading', 'waiting'].includes(item.status))}
                onClick={toConvertDownloadedComments}
              >{i18n.convertDownloadedComments}</Button>
            </div>
            <div className="flex-row-inline flex-cross-center">
              <Button color="primary" variant="text" disabled={totalStatus !== 'error'} onClick={retryFailedDownloads}>{i18n.retryFailedDownload}</Button>
              <Button color="primary" onClick={closeAndAbortDownload}>{i18n.close}</Button>
            </div>
          </div>
        </DialogActions>
      </CssVariablesOfTheme>
    </Dialog>
  )
}

export default MultipleSelectDialog

export interface VideoItem {
  id: string
  thumbnail: string
  title: string
}

interface VideoItemWithDownload extends VideoItem {
  status: DownloadStatus,
  result?: ResultOfFetchDanmaku
  resultText?: string
}

type DownloadStatus = 'waiting' | 'downloading' | 'completed' | 'error'
