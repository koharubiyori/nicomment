import { ThemeProvider } from '@material-ui/core'
import React from 'react'
import useSafePopover from '~/hooks/useSafePopover'
import MainLayout from '~/layout/index'
import { I18nProvider } from '~/utils/i18n'
import { NotifyProvider } from '~/utils/notify'
import { RootParentBase } from './utils/rootParent'
import Routes from './routes'
import theme from './theme'
import CssVariablesOfTheme from './components/cssVariablesOfTheme'


export default function App() {
  useSafePopover()

  return (
    <ThemeProvider theme={theme}>
      <CssVariablesOfTheme>
        <I18nProvider>
          <NotifyProvider maxSnack={3}>
            <RootParentBase>
              <MainLayout>
                <Routes />
              </MainLayout>
            </RootParentBase>
          </NotifyProvider>
        </I18nProvider>
      </CssVariablesOfTheme>
    </ThemeProvider>
  )
}
