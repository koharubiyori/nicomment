import { Dialog, DialogContent, DialogTitle } from '@material-ui/core'
import React, { useState } from 'react'
import { globalI18n, useI18n } from '~/utils/i18n'
import { globalRootParent } from '~/utils/rootParent'
import DanmakuTimeModify, { TimeModification } from './components/timeModify'

let setIsOpenExternalRefer: React.Dispatch<React.SetStateAction<boolean>> = null as any

export interface ShowSettingsModalOptions {

}

export function showDanmakuPreModal() {
  setIsOpenExternalRefer(true)
}

function DanmakuPreModal() {
  const i18n = useI18n() ?? globalI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [timeModification, setTimeModification] = useState<TimeModification>({
    addedModifications: [],
    deletedModifications: []
  })


  setIsOpenExternalRefer = setIsOpen

  if (!i18n) return null
  return (
    <Dialog
      open={isOpen}
      maxWidth={false}
      onClose={() => setIsOpen(false)}
    >
      <DialogTitle>弹幕预处理</DialogTitle>
      <DialogContent
        style={{ marginTop: -20, marginBottom: 16 }}
      >
        <DanmakuTimeModify
          value={timeModification}
          onChange={setTimeModification}
        />
      </DialogContent>
    </Dialog>
  )
}

export default showDanmakuPreModal

globalRootParent().registerRootChild(<DanmakuPreModal />)
