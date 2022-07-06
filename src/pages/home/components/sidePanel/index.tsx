import { Box, Button, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@material-ui/core'
import clsx from 'clsx'
import React, { MouseEvent, useEffect, useState } from 'react'
import path from 'path'
import { appIpcClient } from '~/ipcHub/modules/app'
import { dialogIpcClient } from '~/ipcHub/modules/dialog'
import settingsPrefs from '~/prefs/settingsPrefs'
import { setCurrentLanguage, useI18n } from '~/utils/i18n'
import { notify } from '~/utils/notify'
import classes from './index.scss'
import { Visibility, VisibilityOff, Close } from '@material-ui/icons'
import Autocomplete from '@material-ui/lab/Autocomplete'
import cachePrefs from '~/prefs/cachePrefs'

export interface Props {
  onSearch(searchFormValues: SearchFormValues): void
  onAccountInfoChange(): void
  onSettingsChange(settingsFormValues: SettingsFormValues): void
  onCodeSearch(code: string): void
}

export interface SearchFormValues {
  keyword: string
  sequence: SequenceType
  duration: DurationType
  viewCount: ViewCountType
}

export type SettingsFormValues = typeof settingsPrefs

export type SequenceType =
    'commentMost'
  | 'commentLeast'
  | 'publishLatest'
  | 'publishEarliest'
  | 'viewMost'
  | 'viewLeast'
  | 'commentLatest'
  | 'commentEarliest'
  | 'mylistMost'
  | 'mylistLeast'
  | 'durationMost'
  | 'durationLeast'

export type DurationType =
    'none'
  | '5-'
  | '5-20'
  | '20-60'
  | '60+'

export type ViewCountType =
    'none'
  | '1k-'
  | '1k-5k'
  | '5k - 50k'
  | '50k - 100k'
  | '100k - 500k'
  | '500k+'

function SidePanel(props: Props) {
  const i18n = useI18n()
  const [searchForm, setSearchForm] = useState<SearchFormValues>({
    keyword: '',
    sequence: 'commentMost',
    duration: 'none',
    viewCount: 'none'
  })
  const [smOrSoCode, setSmOrSoCode] = useState('')
  const [settingsForm, setSettingsForm] = useState(() => ({ ...settingsPrefs }))
  const [showPassword, setShowPassword] = useState(false)
  const [searchHistory, setSearchHistory] = useState(cachePrefs.searchHistory)
  const [isKeywordInputFocused, setIsKeywordInputFocused] = useState(false)
  const [isInvalidProxyUrl, setIsInvalidProxyUrl] = useState(false)

  useEffect(() => {
    if (settingsForm.pathOfSave) { return }
    appIpcClient.call('getAppPath')
      .then((appPath: string) => {
        const pathOfSave = path.join(appPath, 'comments')
        setSettingsFormItem('pathOfSave', pathOfSave)
      })
  }, [])

  useEffect(() => {
    setCurrentLanguage(settingsForm.language)
  }, [settingsForm.language])

  useEffect(() => {
    cachePrefs.searchHistory = searchHistory
  }, [searchHistory])

  function setSearchFormItem<T extends keyof typeof searchForm>(itemName: T, value: (typeof searchForm)[T]) {
    setSearchForm(prevVal => ({ ...prevVal, [itemName]: value }))
  }

  function setSettingsFormItem<T extends keyof typeof settingsForm>(itemName: T, value: (typeof settingsForm)[T]) {
    setSettingsForm(prevVal => ({ ...prevVal, [itemName]: value }))
    settingsPrefs[itemName] = value
    props.onSettingsChange(settingsPrefs)
  }

  function setProxySettingsFormItem<T extends keyof typeof settingsForm.proxy>(itemName: T, value: (typeof settingsForm.proxy)[T]) {
    setSettingsFormItem('proxy', {
      ...settingsForm.proxy,
      [itemName]: value
    })
  }

  async function showDirSelectDialog() {
    const result = await dialogIpcClient.showDirSelectDialog({
      title: i18n.selectLocationOfSave,
      properties: ['openDirectory']
    })

    if (result.canceled) { return }
    setSettingsFormItem('pathOfSave', result.filePaths[0])
  }

  function search() {
    if (searchForm.keyword.trim() === '') {
      return notify.warning(i18n.emptyKeywordHintForSearch)
    }

    props.onSearch(searchForm)

    setSearchHistory(prevVal => {
      const newVal = Array.from(new Set(prevVal.concat([searchForm.keyword])))
      if (newVal.length > 6) newVal.pop()
      return newVal
    })
  }

  function codeSearch() {
    if (smOrSoCode.trim() === '') {
      return notify.warning(i18n.emptyCodeHintForSearch)
    }

    if (settingsForm.mail.trim().length === 0 || settingsForm.password.trim().length === 0) {
      return notify.warning(i18n.emptyLoginInfoHintForSearch)
    }

    props.onCodeSearch(smOrSoCode)
  }

  function handleOnDeleteIconOfSearchRecordClick(e: MouseEvent, recordName: string) {
    e.stopPropagation()
    setSearchHistory(prevVal => {
      const newVal = prevVal.filter(item => item !== recordName)
      cachePrefs.searchHistory = newVal
      return newVal
    })
  }

  const sequenceList = Object.entries(i18n.sequenceTypes)
  const durationList = Object.entries(i18n.durationTypes)
  const viewCountList = Object.entries(i18n.viewCountTypes)
  const proxyTypeMap: Record<typeof settingsForm.proxy.type, string> = {
    direct: i18n.directConnect,
    http: 'http',
    socks: 'socks'
  }
  const proxyTypeList = Object.entries(proxyTypeMap)

  const isUsingProxy = settingsForm.proxy.type !== 'direct'

  return (
    <div className={clsx(classes.sideMenuContainer, 'flex-column')}>
      <Box style={{ marginTop: 0 }}>
        <Autocomplete
          options={searchHistory}
          open={searchForm.keyword === '' && isKeywordInputFocused}
          clearOnBlur={false}
          noOptionsText={i18n.noRecordOfSearchHistory}
          popupIcon={null}
          onChange={(e, val) => setSearchFormItem('keyword', val ?? '')}
          renderOption={(recordName, state) =>
            <div className="flex-row flex-between">
              <div>{recordName}</div>
              <Close fontSize="small" style={{ fill: '#757575' }} onClick={(e) => handleOnDeleteIconOfSearchRecordClick(e, recordName)} />
            </div>
          }
          renderInput={(params) =>
            <TextField {...params} fullWidth
              label={i18n.keywordSearch}
              value={searchForm.keyword}
              onKeyDown={e => e.key === 'Enter' && search()}
              onChange={(e) => setSearchFormItem('keyword', e.target.value)}
              onFocus={() => setIsKeywordInputFocused(true)}
              onBlur={() => setIsKeywordInputFocused(false)}
            />
          }
        />
      </Box>
      <Box>
        <FormControl fullWidth>
          <InputLabel>{i18n.sequence}</InputLabel>
          <Select fullWidth
            value={searchForm.sequence}
            onChange={e => setSearchFormItem('sequence', e.target.value as SequenceType)}
          >
            {sequenceList.map(([value, label]) =>
              <MenuItem value={value} key={value}>{label}</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>
      <Box>
        <FormControl fullWidth>
          <InputLabel>{i18n.duration}</InputLabel>
          <Select fullWidth
            value={searchForm.duration}
            onChange={e => setSearchFormItem('duration', e.target.value as DurationType)}
          >
            {durationList.map(([value, label]) =>
              <MenuItem value={value} key={value}>{label}</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>
      <Box>
        <FormControl fullWidth>
          <InputLabel>{i18n.viewCounts}</InputLabel>
          <Select fullWidth
            value={searchForm.viewCount}
            onChange={e => setSearchFormItem('viewCount', e.target.value as ViewCountType)}
          >
            {viewCountList.map(([value, label]) =>
              <MenuItem value={value} key={value}>{label}</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>
      <Box>
        <Button fullWidth
          variant="contained"
          color="primary"
          style={{ marginTop: 20 }}
          onClick={search}
        >{i18n.search}</Button>
      </Box>

      <Box className="flex-row flex-cross-end">
        <TextField
          label={i18n.smOrSoCode}
          className="flex"
          onChange={e => setSmOrSoCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && codeSearch()}
        />
        <Button
          variant="contained"
          color="primary"
          style={{ height: 33, marginLeft: 10 }}
          onClick={codeSearch}
        >{i18n.download}</Button>
      </Box>

      <Typography variant="subtitle1" style={{ marginTop: 20, marginBottom: 10 }}>{i18n.settings}</Typography>
      <RadioGroup row value={settingsForm.language} onChange={(e, val) => setSettingsFormItem('language', val as any)}>
        <div className="flex-row flex-main-center">
          <FormControlLabel
            value="zh"
            label="简体中文"
            control={<Radio color="primary" />}
          />
          <FormControlLabel
            value="jp"
            label="日本語"
            control={<Radio color="primary" />}
          />
        </div>
      </RadioGroup>
      <Box style={{ marginTop: 0 }}>
        <TextField fullWidth
          label={i18n.mail}
          value={settingsForm.mail}
          onChange={e => {
            setSettingsFormItem('mail', e.target.value)
            props.onAccountInfoChange()
          }}
        />
      </Box>
      <Box>
        <TextField fullWidth
          type={showPassword ? 'text' : 'password'}
          label={i18n.password}
          value={settingsForm.password}
          onChange={e => {
            setSettingsFormItem('password', e.target.value)
            props.onAccountInfoChange()
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(prevVal => !prevVal)}>
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Box>
        <TextField fullWidth multiline
          label={i18n.locationOfSave}
          value={settingsForm.pathOfSave}
          InputProps={{ readOnly: true }}
          onClick={showDirSelectDialog}
        />
      </Box>
      {/* <Box>
        <TextField fullWidth
          type="number"
          label={'获取间隔(ms)'}
          value={settingsForm.intervalOfGet}
          onChange={e => setSettingsFormItem('intervalOfGet', parseInt(e.target.value))}
        />
      </Box>
      <Box>
        <TextField fullWidth
          type="number"
          label={'重试次数'}
          value={settingsForm.numberOfRetry}
          onChange={e => setSettingsFormItem('numberOfRetry', parseInt(e.target.value))}
        />
      </Box> */}
      <Typography variant="subtitle1" style={{ marginTop: 20, marginBottom: 10 }}>{i18n.proxySettings}</Typography>
      <Box style={{ marginTop: 0 }}>
        <FormControl fullWidth>
          <InputLabel>{i18n.type}</InputLabel>
          <Select fullWidth
            value={settingsForm.proxy.type}
            onChange={e => setProxySettingsFormItem('type', e.target.value as typeof settingsPrefs.proxy.type)}
          >
            {proxyTypeList.map(([value, label]) =>
              <MenuItem value={value} key={value}>{label}</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>
      <Box>
        <TextField fullWidth
          label="URL"
          helperText={i18n.proxyUrlHelpText}
          disabled={!isUsingProxy}
          value={settingsForm.proxy.hostname}
          error={isInvalidProxyUrl && isUsingProxy}
          onChange={e => {
            setProxySettingsFormItem('hostname', e.target.value)
          }}
          onBlur={e => {
            setIsInvalidProxyUrl(!/^(?!https?:\/\/|socks:\/\/)/.test(e.target.value))
          }}
        />
      </Box>
      <Box>
        <TextField fullWidth
          label={i18n.username}
          helperText={i18n.proxyAuthHelpText}
          disabled={!isUsingProxy}
          value={settingsForm.proxy.username}
          onChange={e => {
            setProxySettingsFormItem('username', e.target.value)
          }}
        />
      </Box>
      <Box>
        <TextField fullWidth
          label={i18n.password}
          helperText={i18n.proxyAuthHelpText}
          disabled={!isUsingProxy}
          value={settingsForm.proxy.password}
          onChange={e => {
            setProxySettingsFormItem('password', e.target.value)
          }}
        />
      </Box>
    </div>
  )
}

export default SidePanel
