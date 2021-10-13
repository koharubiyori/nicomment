import { Button, Input, MenuItem, Select, Tooltip } from '@material-ui/core'
import moment from 'moment'
import React, { ChangeEvent, useMemo, useState } from 'react'
import { useCurrentLanguage, useI18n } from '~/utils/i18n'
import { notify } from '~/utils/notify'
import classes from './index.scss'

export interface TimeModification {
  addedModifications: Modification<'add'>[]
  deletedModifications: Modification<'delete'>[]
}

export interface Props {
  value: TimeModification
  onChange(val: Props['value']): void
}

function DanmakuTimeModify(props: Props) {
  const i18n = useI18n()
  const currentLanguage = useCurrentLanguage()
  const [form, setForm] = useState({
    startPosMinutes: 0,
    startPosSeconds: 0,
    type: 'add' as 'add' | 'delete',
    insertSeconds: 0,
  })
  const totalTime = 20 * 60 * 1000
    + props.value.addedModifications.reduce((result, item) => result + item.endTime - item.startTime, 0)

  // 添加调整
  function addTimeModification() {
    if (form.insertSeconds === 0) {
      return notify.warning(i18n.insertZeroSecondHint)
    }

    // 转为毫秒
    const willAddStartTime = form.startPosMinutes * 60 * 1000 + form.startPosSeconds * 1000
    const willAddEndTime = willAddStartTime + form.insertSeconds * 1000

    // 检查要添加的调整是否和已添加的调整(包括插入和删除)有冲突
    if ([
      ...props.value.addedModifications,
      ...props.value.deletedModifications
    ].some(item =>
      (willAddStartTime >= item.startTime && willAddStartTime <= item.endTime) ||
      (willAddEndTime >= item.startTime && willAddEndTime <= item.endTime)
    )) {
      notify.warning(i18n.timeRangeConflictHint)
      return
    }

    if (form.type === 'add') {
      props.onChange({
        deletedModifications: props.value.deletedModifications,
        addedModifications: props.value.addedModifications.concat([{
          type: 'add',
          startTime: willAddStartTime,
          endTime: willAddEndTime
        }]).sort((a, b) => a.startTime > b.startTime ? 1 : -1),
      })
    } else {
      props.onChange({
        addedModifications: props.value.addedModifications,
        deletedModifications: props.value.deletedModifications.concat([{
          type: 'delete',
          startTime: willAddStartTime,
          endTime: willAddEndTime
        }]).sort((a, b) => a.startTime > b.startTime ? 1 : -1)
      })
    }
  }

  // 计算渲染片段，每个调整将生成两个片段，一个为当前调整的开始时间减去上个调整的结束时间，
  // 另一个为当前调整的结束时间减去开始时间
  function renderFragmentData(type: 'add' | 'delete') {
    // 删除调整的timeline要以添加调整的timeline为基础，显示删除调整
    const usingModificationsData = type === 'add'
      ? props.value.addedModifications
      : [
        ...props.value.addedModifications,
        ...props.value.deletedModifications
      ].sort((a, b) => a.startTime > b.startTime ? 1 : -1)

    return usingModificationsData.reduce<RenderFragment[]>((result, item, index) => {
      const fragment: RenderFragment[] = []
      const getRate = (time: number, min = 0) => {
        const rate = Math.round(time / totalTime * 100)
        return rate < min ? min : rate
      }

      const usingNormalRenderType: RenderFragment['type'] = type === 'add' ? 'normal' : 'transparent'
      if (index === 0) {
        fragment.push({
          type: usingNormalRenderType,
          rate: getRate(item.startTime),
          // 渲染片段要携带调整对象本身，用于删除调整和渲染tooltip
          source: item
        })
      } else {
        const prevItem = usingModificationsData[index - 1]
        fragment.push({
          type: usingNormalRenderType,
          rate: getRate(item.startTime - prevItem.endTime),
          source: item
        })
      }

      fragment.push({
        type: (type === 'delete' && item.type === 'add') ? 'shadow' : type,
        rate: getRate(item.endTime - item.startTime),
        source: item
      })

      return result.concat(fragment)
    }, [])
  }

  const mainTimelineRenderFragments = useMemo(
    () => renderFragmentData('add'),
    [props.value]
  )

  const deleteTimelineRenderFragments = useMemo(
    () => renderFragmentData('delete'),
    [props.value]
  )

  // timeline最后要添加一个剩余宽度的占位片段，这里计算占位片段的flex
  const lastFragmentFlexOfMainTimeline = mainTimelineRenderFragments.reduce((result, item) => result - item.rate, 100)
  const lastFragmentFlexOfDeleteTimeline = deleteTimelineRenderFragments.reduce((result, item) => result - item.rate, 100)

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

  function formatTimeRangeText(modification: Modification) {
    return moment(modification.startTime).format('mm:ss')
      + ' ~ '
      + moment(modification.endTime).format('mm:ss')
  }

  return (
    <div style={{ minWidth: 800 }}>
      <div className={classes.title}>{i18n.timeModify}</div>
      <div style={{ margin: '20px 0' }}>
        <div className={classes.timeline}>
          <div className="beginPoint" />
          <div className="endPoint" />
          <div className="beginTime">0:00</div>
          <div className="endTime">{moment(totalTime).format('mm:ss')}</div>
          {mainTimelineRenderFragments.map((item, index) =>
            <Tooltip arrow
              key={index}
              title={formatTimeRangeText(item.source)}
              {...(item.type !== 'add' && { open: false })}
              placement="top"
            >
              <div
                data-type={item.type}
                style={{ flex: item.rate }}
                className="fragment"
              />
            </Tooltip>
          )}
          <div data-type="normal" className="fragment" style={{ flex: lastFragmentFlexOfMainTimeline }} />
        </div>
        <div className={classes.timeline} style={{ marginTop: 10 }}>
          {deleteTimelineRenderFragments.map((item, index) =>
            <Tooltip arrow
              key={index}
              title={formatTimeRangeText(item.source)}
              {...(item.type !== 'delete' && { open: false })}
              placement="bottom"
            >
              <div
                data-type={item.type}
                style={{ flex: item.rate }}
                className="fragment"
              />
            </Tooltip>
          )}
          <div data-type="transparent" className="fragment" style={{ flex: lastFragmentFlexOfDeleteTimeline }} />
        </div>
      </div>

      <div style={{ fontSize: 12, marginTop: 35, color: '#666' }}>{i18n.hintForTimelineChartOfTimeModify}</div>

      <div className="flex-row" style={{ alignItems: 'baseline', marginTop: 5 }}>
        <span>{i18n.operate}：</span>
        {currentLanguage === 'zh' && <>
          <span>{i18n.in}</span>
          <Input
            value={form.startPosMinutes}
            type="number"
            style={{ width: 40, margin: '0 3px' }}
            onChange={noMinusValSetter(newVal => setForm(prevVal => ({ ...prevVal, startPosMinutes: newVal })))}
          />
          <span>{i18n.minute}</span>
          <Input
            value={form.startPosSeconds}
            type="number"
            style={{ width: 30, margin: '0 3px' }}
            onChange={minuteSecondValSetter(newVal => setForm(prevVal => ({ ...prevVal, startPosSeconds: newVal })))}
          />
          <span>{i18n.second}</span>
          <span>{i18n.place}</span>
          <Select
            value={form.type}
            style={{ width: 70, margin: '0 5px' }}
            onChange={e => setForm(prevVal => ({ ...prevVal, type: e.target.value as any }))}
          >
            <MenuItem value="add">{i18n.insert}</MenuItem>
            <MenuItem value="delete">{i18n.delete}</MenuItem>
          </Select>
          <Input
            value={form.insertSeconds}
            type="number"
            style={{ width: 60 }}
            onChange={noMinusValSetter(newVal => setForm(prevVal => ({ ...prevVal, insertSeconds: newVal })))}
          />
          <span>{i18n.second}</span>
        </>}

        {currentLanguage === 'jp' && <>
        <Input
            value={form.startPosMinutes}
            type="number"
            style={{ width: 40, margin: '0 3px' }}
            onChange={noMinusValSetter(newVal => setForm(prevVal => ({ ...prevVal, startPosMinutes: newVal })))}
          />
          <span>{i18n.minute}</span>
          <Input
            value={form.startPosSeconds}
            type="number"
            style={{ width: 30, margin: '0 3px' }}
            onChange={minuteSecondValSetter(newVal => setForm(prevVal => ({ ...prevVal, startPosSeconds: newVal })))}
          />
          <span>{i18n.second}</span>
          <span>{i18n.in}</span>
          <Input
            value={form.insertSeconds}
            type="number"
            style={{ width: 60 }}
            onChange={noMinusValSetter(newVal => setForm(prevVal => ({ ...prevVal, insertSeconds: newVal })))}
          />
          <span>{i18n.second}</span>
          <span>{i18n.hold}</span>
          <Select
            value={form.type}
            style={{ width: 70, margin: '0 5px' }}
            onChange={e => setForm(prevVal => ({ ...prevVal, type: e.target.value as any }))}
          >
            <MenuItem value="add">{i18n.insert}</MenuItem>
            <MenuItem value="delete">{i18n.delete}</MenuItem>
          </Select>
          <span>{i18n.do}</span>
        </>}

        <Button
          variant="contained"
          color="primary"
          size="small"
          style={{ marginLeft: 10 }}
          onClick={addTimeModification}
        >{i18n.add}</Button>
      </div>
    </div>
  )
}

export default DanmakuTimeModify


interface Modification<Type extends 'add' | 'delete' = 'add' | 'delete'> {
  type: Type
  startTime: number
  endTime: number
}

interface RenderFragment {
  rate: number
  type: 'normal' | 'add' | 'delete' | 'transparent' | 'shadow'  // shadow同样为透明，但minSize和add与delete相同
  source: Modification
}


