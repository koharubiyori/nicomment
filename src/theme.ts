import { createMuiTheme } from '@material-ui/core'
import colors from '~/styles/globals.scss'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: colors.main,
      dark: colors.dark,
      light: colors.light,
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
