import { Box, Button, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from '@material-ui/core'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import path from 'path'
import { appIpcClient } from '~/ipcHub/modules/app'
import { dialogIpcClient } from '~/ipcHub/modules/dialog'
import settingsPref from '~/prefs/settingsPref'
import { useI18n } from '~/utils/i18n'
import { notify } from '~/utils/notify'
import classes from './index.scss'
import { Visibility, VisibilityOff } from '@material-ui/icons'

export interface Props {
  onSearch(searchFormValues: SearchFormValues, settingsFormValues: SettingsFromValues): void
}

export interface SearchFormValues {
  keyword: string
  order: OrderType
  duration: DurationType
  viewCount: ViewCountType
}

export interface SettingsFromValues {
  mail: string
  password: string
  intervalOfGet: number
  numberOfRetry: number
}

export type OrderType =
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
    order: 'commentMost',
    duration: 'none',
    viewCount: 'none'
  })
  const [settingsForm, setSettingsForm] = useState(() => ({ ...settingsPref }))
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (settingsForm.pathOfSave) { return }
    appIpcClient.call('getAppPath')
      .then((appPath: string) => {
        const pathOfSave = path.join(appPath, 'comments')
        setSettingsFormItem('pathOfSave', pathOfSave)
      })
  }, [])

  function setSearchFormItem<T extends keyof typeof searchForm>(itemName: T, value: (typeof searchForm)[T]) {
    setSearchForm(prevVal => ({ ...prevVal, [itemName]: value }))
  }

  function setSettingsFormItem<T extends keyof typeof settingsForm>(itemName: T, value: (typeof settingsForm)[T]) {
    settingsPref[itemName] = value
    setSettingsForm(prevVal => ({ ...prevVal, [itemName]: value }))
  }

  async function showDirSelectDialog() {
    const result = await dialogIpcClient.showDirSelectDialog({
      title: '选择保存位置',
      properties: ['openDirectory']
    })

    if (result.canceled) { return }
    setSettingsFormItem('pathOfSave', result.filePaths[0])
  }

  function search() {
    if (searchForm.keyword.trim() === '') {
      return notify.warning('搜索关键词不能为空')
    }
  }

  const orderList = Object.entries(i18n.orderTypes)
  const durationList = Object.entries(i18n.durationTypes)
  const viewCountList = Object.entries(i18n.viewCountTypes)

  return (
    <div className={clsx(classes.sideMenuContainer, 'flex-column')}>
      <Box style={{ marginTop: 0 }}>
        <TextField fullWidth
          label={i18n.keywordSearch}
          onChange={e => setSearchFormItem('keyword', e.target.value)}
        />
      </Box>
      <Box>
        <FormControl fullWidth>
          <InputLabel>{i18n.order}</InputLabel>
          <Select fullWidth
            value={searchForm.order}
            onChange={e => setSearchFormItem('order', e.target.value as OrderType)}
          >
            {orderList.map(([value, label]) =>
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
          <InputLabel>{i18n.viewCount}</InputLabel>
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
        >搜索</Button>
      </Box>

      <Typography variant="subtitle1" style={{ marginTop: 20, marginBottom: 10 }}>设置</Typography>
      <Box style={{ marginTop: 0 }}>
        <TextField fullWidth
          label={'邮箱'}
          value={settingsForm.mail}
          onChange={e => setSettingsFormItem('mail', e.target.value)}
        />
      </Box>
      <Box>
        <TextField fullWidth
          type={showPassword ? 'text' : 'password'}
          label={'密码'}
          value={settingsForm.password}
          onChange={e => setSettingsFormItem('password', e.target.value)}
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
          label={'保存位置'}
          value={settingsForm.pathOfSave}
          InputProps={{ readOnly: true }}
          onClick={showDirSelectDialog}
        />
      </Box>
      <Box>
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
      </Box>
    </div>
  )
}

export default SidePanel
