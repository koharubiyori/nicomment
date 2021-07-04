import { ThemeProvider } from '@material-ui/core'
import React from 'react'
import MainLayout from '~/layout'
import Routes from '../routes'
import theme from './theme'


export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <MainLayout>
        <Routes />
      </MainLayout>
    </ThemeProvider>
  )
}
