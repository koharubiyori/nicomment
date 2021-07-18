import { ThemeProvider } from '@material-ui/core'
import React from 'react'
import useSafePopover from '~/hooks/useSafePopover'
import MainLayout from '~/layout/index'
import { I18nProvider } from '~/utils/i18n'
import { NotifyProvider } from '~/utils/notify'
import Routes from './routes'
import theme from './theme'


export default function App() {
  useSafePopover()

  return (
    <ThemeProvider theme={theme}>
      <I18nProvider>
        <NotifyProvider maxSnack={3}>
          <MainLayout>
            <Routes />
          </MainLayout>
        </NotifyProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
