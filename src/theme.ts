import { createMuiTheme } from '@material-ui/core'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      dark: '#2e3b85',
      light: '#4f64e0',
      contrastText: 'white'
    },
  },
  overrides: {
    MuiTouchRipple: {
      child: {
        backgroundColor: 'white'
      }
    }
  }
})

export default theme
