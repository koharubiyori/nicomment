import { Button, Dialog, DialogContent, DialogTitle, Input, MenuItem, Select } from '@material-ui/core'
import React, { createContext, useState } from 'react'
import ReactDOM from 'react-dom'
import { globalRootParent } from '~/utils/rootParent'
import { globalI18n, useI18n } from '~/utils/i18n'
import classes from './index.scss'

let setIsOpenExternalRefer: React.Dispatch<React.SetStateAction<boolean>> = null as any

export interface ShowSettingsModalOptions {

}

export function showSettingsModal() {
  setIsOpenExternalRefer(true)
}

function SettingsModal() {
  const i18n = useI18n() ?? globalI18n()

  const [isOpen, setIsOpen] = useState(false)
  const [addModifications, setAddModifications] = useState<Modification<'add'>[]>([])
  const [deletedModifications, setDeletedModifications] = useState<Modification<'delete'>[]>([])

  setIsOpenExternalRefer = setIsOpen

  // if (!i18n) return null

  // const isIn

  const mainTimelineRenderFragments = deletedModifications.reduce((result, item) => {
    const fragment = []

    if (result.length === 0) {

    } else {

    }
  }, [])

  return (
    <Dialog
      open={isOpen}
      maxWidth={false}
      onClose={() => setIsOpen(false)}
    >
      <DialogTitle>弹幕预处理</DialogTitle>
      <DialogContent
        style={{ minWidth: 800, marginTop: -20, marginBottom: 16 }}
      >
        <div className={classes.title}>时间调整</div>
        <div>
          <div className={classes.timeline}>
          </div>
          <div className={classes.timeline}></div>
        </div>

        <div className="flex-row" style={{ alignItems: 'baseline' }}>
          <span>操作：</span>
          <span>在</span>
          <Input style={{ width: 30, margin: '0 3px' }} />
          <span>分</span>
          <Input style={{ width: 30, margin: '0 3px' }} />
          <span>秒</span>
          <span>处</span>
          <Select style={{ width: 70, margin: '0 5px' }}>
            <MenuItem value="add">插入</MenuItem>
            <MenuItem value="delete">删除</MenuItem>
          </Select>
          <Input style={{ width: 40 }} />
          <span>秒</span>
          <Button variant="contained" color="primary" size="small" style={{ marginLeft: 10 }}>添加</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal

globalRootParent().registerRootChild(<SettingsModal />)

interface Modification<Type extends 'add' | 'delete'> {
  type: Type
  startTime: number
  endTime: number
}

interface RenderFragment {
  rate: number
  type: 'normal' | 'add'
}
