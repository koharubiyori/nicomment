import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import React, { useEffect, useRef, useState } from 'react'
import downloadDanmaku from '~/utils/business/downloadDanmaku'
import { globalI18n, useI18n } from '~/utils/i18n'
import { notify } from '~/utils/notify'
import { globalRootParent } from '~/utils/rootParent'
import DanmakuTimeModify, { TimeModification } from './components/timeModify'
import classes from './index.scss'

type DanmakuData = Record<string, any>

let modalClient: {
  showModal(options: ShowSettingsModalOptions): void
  hideModal(): void
} = null!

export interface ShowSettingsModalOptions {
  danmakuData: DanmakuData
  savePath: string
}

export function showDanmakuPreModal(options: ShowSettingsModalOptions) {
  modalClient.showModal(options)
}

function DanmakuPreModal() {
  const i18n = useI18n() ?? globalI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [danmakuData, setDanmakuData] = useState<DanmakuData | null>(null)
  const [timeModifications, setTimeModifications] = useState<TimeModification>({
    addedModifications: [],
    deletedModifications: []
  })
  const optionsRef = useRef<ShowSettingsModalOptions>(null!)

  modalClient = {
    showModal, hideModal
  }

  function showModal(options: ShowSettingsModalOptions) {
    setIsOpen(true)
    setDanmakuData(options.danmakuData)
    setTimeModifications({
      addedModifications: [],
      deletedModifications: []
    })
    optionsRef.current = options
  }

  function hideModal() {
    setIsOpen(false)
    optionsRef.current = null as any
  }

  async function download() {
    const result = await downloadDanmaku(danmakuData!.contentId, {
      title: danmakuData!.title,
      savePath: optionsRef.current.savePath,
      processDanmakuData: data => {
        const allTimeModification = [
          ...timeModifications.addedModifications,
          ...timeModifications.deletedModifications
        ].sort((a, b) => a.startTime > b.startTime ? 1 : -1)

        return allTimeModification.reduce((result, item) => {
          const ms2vpos = (ms: number) => Math.round(ms / 10)
          const modifyDurationVpos = ms2vpos(item.endTime - item.startTime)
          const startTimeVpos = ms2vpos(item.startTime)
          const endTimeVpos = ms2vpos(item.endTime)

          if (item.type === 'add') {
            return result.map(commentItem => ({
              ...commentItem,
              ...(commentItem.vpos >= startTimeVpos && { vpos: commentItem.vpos + modifyDurationVpos })
            }))
          } else {
            return result
              .filter(commentItem => {
                console.log(commentItem.vpos, startTimeVpos, endTimeVpos)
                return !(commentItem.vpos >= startTimeVpos && commentItem.vpos < endTimeVpos)
              })
              .map(commentItem => ({
                ...commentItem,
                ...(commentItem.vpos > endTimeVpos && { vpos: commentItem.vpos - modifyDurationVpos })
              }))
          }
        }, data)
      }
    })

    if (result.success) {
      notify.success(i18n.successHintOfDownloadComments(result.videoInfo!.video.title, result.fileContent!.commentTotal), ['top', 'right'])
    } else if (result.type === 'failedDownloadFile') {
      notify.error(i18n.failHintOfDownloadComments, ['top', 'right'])
    } else if (result.type === 'failedSaveFile') {
      notify.error(i18n.failHintOfSaveComments, ['top', 'right'])
    }
  }

  const buttonRippleClasses: Parameters<typeof Button>[0]['TouchRippleProps'] = {
    classes: {
      child: classes.actions
    }
  }

  if (!i18n) return null
  return (
    <Dialog
      open={isOpen}
      maxWidth={false}
      onClose={() => setIsOpen(false)}
    >
      <DialogTitle>{i18n.danmakuPretreatment}</DialogTitle>
      <DialogContent
        style={{ marginTop: -20, marginBottom: 16 }}
      >
        <DanmakuTimeModify
          value={timeModifications}
          danmakuData={danmakuData!}
          onChange={setTimeModifications}
        />
      </DialogContent>

      <DialogActions>
        <Button color="primary" onClick={hideModal} TouchRippleProps={buttonRippleClasses}>{i18n.close}</Button>
        <Button color="primary" onClick={download} TouchRippleProps={buttonRippleClasses}>{i18n.download}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default showDanmakuPreModal

globalRootParent().registerRootChild(<DanmakuPreModal />)
