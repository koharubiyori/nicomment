import { Button, Dialog, DialogContent, DialogTitle, Input, MenuItem, Select } from '@material-ui/core'
import React, { ChangeEvent, createContext, useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import { globalRootParent } from '~/utils/rootParent'
import { globalI18n, useI18n } from '~/utils/i18n'
import classes from './index.scss'
import { notify } from '~/utils/notify'

let setIsOpenExternalRefer: React.Dispatch<React.SetStateAction<boolean>> = null as any

export interface ShowSettingsModalOptions {

}

export function showSettingsModal() {
  setIsOpenExternalRefer(true)
}

function SettingsModal() {
  const i18n = useI18n() ?? globalI18n()

  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({
    startPosMinutes: 0,
    startPosSeconds: 0,
    type: 'add' as RenderFragment['type'],
    insertSeconds: 0,
  })
  const [addModifications, setAddModifications] = useState<Modification<'add'>[]>([])
  const [deletedModifications, setDeletedModifications] = useState<Modification<'delete'>[]>([])
  const totalTime = 20 * 60 * 1000

  setIsOpenExternalRefer = setIsOpen

  // if (!i18n) return null

  // const isIn

  function addTimeModification() {
    if (form.insertSeconds === 0) {
      return notify.warning('要插入秒数不能为0')
    }

    if (form.type === 'add') {
      const willAddStartTime = form.startPosMinutes * 60 * 1000 + form.startPosSeconds * 1000
      const willAddEndTime = willAddStartTime + form.insertSeconds * 1000

      if (addModifications.some(item =>
        (willAddStartTime >= item.startTime && willAddStartTime <= item.endTime) ||
        (willAddEndTime >= item.startTime && willAddEndTime <= item.endTime)
      )) {
        notify.warning('要添加的修改时间段和其他时间段存在冲突')
      }

      setAddModifications(prevVal => {
        return prevVal.concat([{
          type: 'add',
          startTime: willAddStartTime,
          endTime: willAddEndTime
        }]).sort((a, b) => a.startTime > b.startTime ? 1 : -1)
      })
    } else {

    }
  }

  const mainTimelineRenderFragments = useMemo(() => {
    return addModifications.reduce<RenderFragment[]>((result, item, index) => {
      const fragment: RenderFragment[] = []
      const getRate = (time: number) => {
        const rate = Math.round(time / totalTime * 100)
        return rate < 5 ? 5 : rate
      }

      if (index === 0) {
        fragment.push({ type: 'normal', rate: getRate(item.startTime) })
        fragment.push({ type: 'add', rate: getRate(item.endTime - item.startTime) })
      } else {
        const prevItem = addModifications[index]
        console.log(prevItem, item)
        fragment.push({ type: 'normal', rate: getRate(item.startTime - prevItem.endTime) })
        fragment.push({ type: 'add', rate: getRate(item.endTime - item.startTime) })
      }

      return result.concat(fragment)
    }, [])
  }, [addModifications])

  const lastNormalFragmentFlex = mainTimelineRenderFragments.reduce((result, item) => result - item.rate, 100)

  const minuteSecondValSetter = (setFn: (newVal: number) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const newVal = parseInt(e.target.value || '0')
      if (newVal < 0 || newVal > 59) { return }
      setFn(newVal)
    }

  const noMinusValSetter = (setFn: (newVal: number) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const newVal = parseInt(e.target.value || '0')
      if (newVal < 0) { return }
      setFn(newVal)
    }

  console.log(addModifications, mainTimelineRenderFragments)
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
        <div style={{ margin: '20px 0' }}>
          <div className={classes.timeline}>
            <div className="beginPoint" />
            <div className="endPoint" />
            <div className="beginTime">0:00</div>
            <div className="endTime">20:00</div>
            {mainTimelineRenderFragments.map((item, index) =>
              <div key={index} data-type={item.type} style={{ flex: item.rate }} className="fragment" />
            )}

            <div data-type="normal" className="fragment" style={{ flex: lastNormalFragmentFlex }} />
          </div>
          <div className={classes.timeline} style={{ marginTop: 20 }}></div>
        </div>

        <div className="flex-row" style={{ alignItems: 'baseline' }}>
          <span>操作：</span>
          <span>在</span>
          <Input
            value={form.startPosMinutes}
            type="number"
            style={{ width: 40, margin: '0 3px' }}
            onChange={noMinusValSetter(newVal => setForm(prevVal => ({ ...prevVal, startPosMinutes: newVal })))}
          />
          <span>分</span>
          <Input
            value={form.startPosSeconds}
            type="number"
            style={{ width: 30, margin: '0 3px' }}
            onChange={minuteSecondValSetter(newVal => setForm(prevVal => ({ ...prevVal, startPosSeconds: newVal })))}
          />
          <span>秒</span>
          <span>处</span>
          <Select
            value={form.type}
            style={{ width: 70, margin: '0 5px' }}
            onChange={e => setForm(prevVal => ({ ...prevVal, type: e.target.value as any }))}
          >
            <MenuItem value="add">插入</MenuItem>
            <MenuItem value="delete">删除</MenuItem>
          </Select>
          <Input
            value={form.insertSeconds}
            type="number"
            style={{ width: 60 }}
            onChange={noMinusValSetter(newVal => setForm(prevVal => ({ ...prevVal, insertSeconds: newVal })))}
          />
          <span>秒</span>
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: 10 }}
            onClick={addTimeModification}
          >添加</Button>
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
