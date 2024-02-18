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
      title: i18n.selectDanmakuFileToConvert,
      properties: ['openFile', 'multiSelections'],
      defaultPath: path.join(appPath, 'comments'),
      filters: [{ name: i18n.niconicoDanmakuFile, extensions: ['xml'] }]
    })

    if (result.canceled) { return }
    setFileList(result.filePaths)
  }

  async function showDialogToSelectDirOfOutputAss() {
    const appPath = await appIpcClient.call('getAppPath')
    const result = await dialogIpcClient.showFilesSelectDialog({
      title: i18n.selectDirPathForOutput,
      properties: ['openDirectory'],
      defaultPath: path.join(appPath, 'ass'),
    })

    if (result.canceled) { return }
    updateConfig('outputPath', result.filePaths[0])
  }

  async function startConvert() {
    if (fileList.length === 0) return notify.warning(i18n.hintForNoDanmakuFiles)
    const checkingResult = Danmaku2assWithFilters.checkIfConfigIsValid(config)
    if (checkingResult.valid) {
      setIsConverting(true)
      notify.info(i18n.startToConvert)
      const convertNotify = createTextUpdatableNotify(i18n.hintForConvertProgress(0, fileList.length), { variant: 'info', hideIconVariant: true })
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

        convertNotify.updateText(i18n.hintForConvertProgress(i + 1, fileList.length))
      }

      setIsConverting(false)
      convertNotify.close()
      notify[failedCount === 0 ? 'success' : 'warning'](i18n.hintForConvertCompleted(succeedCount, failedCount), {
        autoHideDuration: 5000
      })

      if (failedCount !== 0) {
        const appPath = await appIpcClient.call('getAppPath')
        const logFilePath = path.join(appPath, 'output.log')
        await fsPromise.writeFile(logFilePath, log, 'utf8')
        notify.error(i18n.hintForSavePathOfLogOfFailedConvert, { autoHideDuration: 5000 })
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
    return fileList[0] + ' ' + i18n.andSomeOtherFiles(fileList.length - 1)
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
      <DialogTitle>{i18n.danmakuConvert}</DialogTitle>
      <DialogContent style={{ minWidth: 800 }} className={classes.textFieldsNotBreakLine}>
        <TextField fullWidth
          style={{ marginTop: -10 }}
          label={i18n.pathOfDanmakuFiles}
          value={showingFilesText}
          InputProps={{ readOnly: true }}
          InputLabelProps={{ shrink: true }}
          placeholder={i18n.clickHereToSelectFiles}
          onClick={showDialogToSelectFiles}
        />
        <TextField fullWidth
          style={{ marginTop: 10 }}
          label={i18n.pathOfOutputDir}
          value={config.outputPath}
          InputProps={{ readOnly: true }}
          InputLabelProps={{ shrink: true }}
          placeholder={i18n.clickHereToSelectDir}
          onClick={showDialogToSelectDirOfOutputAss}
        />

        <div className='flex-row' style={{ marginTop: 20 }}>
          <div style={{ width: '9em' }}>{i18n.parameterForSubtitleFileGeneration}：</div>
          <div className='flex' style={{ marginLeft: '1em' }}>
            <Grid container spacing={1}>
              <Grid item xs={2}>
                <TextField
                  value={config.videoWidth}
                  type="number"
                  label={i18n.videoWidth}
                  onChange={e => updateConfig('videoWidth', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.videoHeight}
                  type="number"
                  label={i18n.videoHeight}
                  onChange={e => updateConfig('videoHeight', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.danmakuFontSize}
                  type="number"
                  label={i18n.fontSize}
                  onChange={e => updateConfig('danmakuFontSize' ,parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.danmakuOpacity}
                  type="number"
                  label={i18n.opacity}
                  onChange={e => updateConfig('danmakuOpacity', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={config.scrollingDanmakuDuration}
                  type="number"
                  label={i18n.durationOfScrollingDanmaku}
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
                  label={i18n.durationOfStaticDanmaku}
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
                  label={i18n.danmakuFont}
                  onChange={e => updateConfig('danmakuFont', e.target.value)}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth
                  value={config.protectHeight}
                  type="number"
                  label={i18n.protectHeightForFooter}
                  onChange={e => updateConfig('protectHeight', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </div>
        </div>
        <div className='flex-row' style={{ marginTop: 20 }}>
          <div style={{ width: '9em' }}>{i18n.parameterForDanmakuFilter}：</div>
          <div className='flex flex-column' style={{ marginLeft: '1em' }}>
            <Grid container spacing={1}>
              <Grid item xs={2}>
                <TextField
                  value={config.ngScore}
                  type="number"
                  label="NG Score"
                  placeholder={i18n.helpTextForNgScore}
                  InputLabelProps={{ shrink: true }}
                  onChange={e => updateConfig('ngScore', e.target.value)}
                />
              </Grid>
              <Grid item xs={10}>
                <TextField fullWidth
                  value={config.blockedWords}
                  type="text"
                  label={i18n.fliterByKeyWord}
                  placeholder={i18n.splitByHelfComma}
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
              label={i18n.filterByRegex}
              placeholder={i18n.splitByLineBreak}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={e => updateConfig('filters', e.target.value)}
            />
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button color="primary" TouchRippleProps={buttonRippleClasses} onClick={() => setIsOpen(false)}>{i18n.close}</Button>
        <Button color="primary" disabled={isConverting} TouchRippleProps={buttonRippleClasses} onClick={() => startConvert()}>{isConverting ? i18n.converting + '...' : i18n.convert}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default Danmaku2assModal

globalRootParent().registerRootChild(() => <Danmaku2assModal />)
