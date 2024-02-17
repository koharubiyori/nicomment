import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, TextField } from '@material-ui/core'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { globalRootParent } from '~/utils/rootParent'
import { useI18n } from '~/utils/i18n'
import danmaku2assPrefs, { Danmaku2assConfig } from '~/prefs/danmaku2assPrefs'
import { dialogIpcClient } from '~/ipcHub/modules/dialog'
import { appIpcClient } from '~/ipcHub/modules/app'
import path from 'path'
import classes from './index.scss'
import { notify, createTextUpdatableNotify } from '~/utils/notify'
import Danmaku2assWithFilters from '~/utils/danmaku2assWithfilters'
import fsPromise from 'fs/promises'

export interface Props {

}

export let showDanmaku2assModal: () => void = null as any

function Danmaku2assModal(props: PropsWithChildren<Props>) {
  const i18n = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [fileList, setFileList] = useState<string[]>([])
  const [isConverting, setIsConverting] = useState(false)

  const [config, updateConfig] = (() => {
    const [config, setConfig] = useState(danmaku2assPrefs)

    return [
      config,
      <T extends keyof Danmaku2assConfig>(key: T, value: Danmaku2assConfig[T]) => {
        queueMicrotask(() => danmaku2assPrefs[key] = value)
        setConfig(prevVal => ({ ...prevVal, [key]: value }))
      }
    ]
  })()

  showDanmaku2assModal = () => {
    setIsOpen(true)
  }

  useEffect(() => {
    if (config.outputPath) { return }
    appIpcClient.call('getAppPath')
      .then(appPath => {
        updateConfig('outputPath', path.join(appPath, 'ass'))
      })
  }, [])

  useEffect(() => {
    if (isOpen) setFileList([])
  }, [isOpen])

  async function showDialogToSelectFiles() {
    const appPath = await appIpcClient.call('getAppPath')
    const result = await dialogIpcClient.showFilesSelectDialog({
      title: '选择要转换的弹幕文件',
      properties: ['openFile', 'multiSelections'],
      defaultPath: path.join(appPath, 'comments'),
      filters: [{ name: 'niconico弹幕文件', extensions: ['xml'] }]
    })

    if (result.canceled) { return }
    setFileList(result.filePaths)
  }

  async function showDialogToSelectDirOfExportingAss() {
    const appPath = await appIpcClient.call('getAppPath')
    const result = await dialogIpcClient.showFilesSelectDialog({
      title: '选择导出文件夹路径',
      properties: ['openDirectory'],
      defaultPath: path.join(appPath, 'ass'),
    })

    if (result.canceled) { return }
    updateConfig('outputPath', result.filePaths[0])
  }

  async function startConvert() {
    if (fileList.length === 0) return notify.warning('弹幕文件列表不能为空')
    const checkingResult = Danmaku2assWithFilters.checkIfConfigIsValid(config)
    if (checkingResult.valid) {
      setIsConverting(true)
      notify.info('开始转换')
      const convertNotify = createTextUpdatableNotify(`转换进度：0 / ${fileList.length}`, { variant: 'info', hideIconVariant: true })
      let succeedCount = 0
      let failedCount = 0
      let log = ''
      for (let i=0, len=fileList.length; i < len; i++) {
        const item = fileList[i]
        try {
          await Danmaku2assWithFilters.convert(item, config.outputPath, { ...config, isOutputPathOnlyDir: true })
          succeedCount++
        } catch(e: any) {
          failedCount++
          log += e.toString() + '\n'
        }

        convertNotify.updateText(`转换进度：${i + 1} / ${fileList.length}`)
      }

      setIsConverting(false)
      convertNotify.close()
      notify.success(`转换完毕，成功${succeedCount}个，失败${failedCount}个！`)

      if (failedCount !== 0) {
        const appPath = await appIpcClient.call('getAppPath')
        const logFilePath = path.join(appPath, 'output.log')
        await fsPromise.writeFile(logFilePath, log, 'utf8')
        notify.error(`失败的相关日志已保存至根目录的output.log中`)
      }
    } else {
      if (checkingResult.reason === 'hasEmptyItemInAssGeneration') notify.warning('')
      if (checkingResult.reason === 'invalidRegExp') notify.warning('')
      return
    }
  }

  const showingFilesText = (() => {
    if (fileList.length === 0) return ''
    if (fileList.length === 1) return fileList[0]
    return fileList[0] + '等x个文件'
  })()

  const buttonRippleClasses: Parameters<typeof Button>[0]['TouchRippleProps'] = {
    classes: {
      child: classes.actions
    }
  }

  return (
    <Dialog
      open={isOpen}
      maxWidth={false}
      onClose={() => setIsOpen(false)}
    >
      <DialogTitle>弹幕转换</DialogTitle>
      <DialogContent style={{ minWidth: 800 }}>
        <TextField fullWidth
          style={{ marginTop: -10 }}
          label="弹幕文件路径"
          value={showingFilesText}
          InputProps={{ readOnly: true }}
          InputLabelProps={{ shrink: true }}
          placeholder="点击此处选择文件"
          onClick={showDialogToSelectFiles}
        />
        <TextField fullWidth
          style={{ marginTop: 10 }}
          label="输出文件夹路径"
          value={config.outputPath}
          InputProps={{ readOnly: true }}
          InputLabelProps={{ shrink: true }}
          placeholder="点击此处选择文件夹"
          onClick={showDialogToSelectDirOfExportingAss}
        />

        <div className='flex-row' style={{ marginTop: 20 }}>
          <div style={{ width: '10em' }}>字幕文件生成参数：</div>
          <div className='flex'>
            <Grid container spacing={1}>
              <Grid item xs={2}>
                <TextField
                  value={config.screenWidth}
                  type="number"
                  label="屏幕宽度"
                  onChange={e => updateConfig('screenWidth', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.screenHeight}
                  type="number"
                  label="屏幕高度"
                  onChange={e => updateConfig('screenHeight', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.danmakuFontSize}
                  type="number"
                  label="字体大小"
                  onChange={e => updateConfig('danmakuFontSize' ,parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.danmakuOpacity}
                  type="number"
                  label="不透明度"
                  onChange={e => updateConfig('danmakuOpacity', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.scrollingDanmakuDuration}
                  type="number"
                  label="滚动弹幕持续时间"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">秒</InputAdornment>,
                  }}
                  onChange={e => updateConfig('scrollingDanmakuDuration' ,parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth
                  value={config.staticDanmakuDuration}
                  type="number"
                  label="静止弹幕持续时间"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">秒</InputAdornment>,
                  }}
                  onChange={e => updateConfig('staticDanmakuDuration', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1}>
              <Grid item xs={2}>
                <TextField fullWidth
                  value={config.danmakuFont}
                  label="弹幕字体"
                  onChange={e => updateConfig('danmakuFont', e.target.value)}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth
                  value={config.protectHeight}
                  type="number"
                  label="底部预留高度"
                  onChange={e => updateConfig('protectHeight', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </div>
        </div>
        <div className='flex-row' style={{ marginTop: 20 }}>
          <div style={{ width: '10em' }}>弹幕过滤参数：</div>
          <div className='flex flex-column'>
            <Grid container spacing={1}>
              <Grid item xs={2}>
                <TextField
                  value={config.ngScore}
                  type="number"
                  label="NG Score"
                  placeholder='为空或0时不过滤'
                  InputLabelProps={{ shrink: true }}
                  onChange={e => updateConfig('ngScore', e.target.value)}
                />
              </Grid>
              <Grid item xs={10}>
                <TextField fullWidth
                  value={config.blockedWords}
                  type="text"
                  label="关键词过滤"
                  placeholder='以半角逗号分隔'
                  InputLabelProps={{ shrink: true }}
                  onChange={e => updateConfig('blockedWords', e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField fullWidth multiline
              rows={5}
              style={{ marginTop: 10 }}
              value={config.filters}
              type="text"
              label="正则表达式过滤"
              placeholder='以换行分隔'
              InputLabelProps={{
                shrink: true,
              }}
              onChange={e => updateConfig('filters', e.target.value)}
            />
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button color="primary" TouchRippleProps={buttonRippleClasses} onClick={() => setIsOpen(false)}>{'关闭'}</Button>
        <Button color="primary" disabled={isConverting} TouchRippleProps={buttonRippleClasses} onClick={() => startConvert()}>{isConverting ? '转换中...' : '转换'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default Danmaku2assModal

globalRootParent().registerRootChild(() => <Danmaku2assModal />)
