import { createMuiTheme } from '@material-ui/core'
import { purple } from '@material-ui/core/colors'

const theme = createMuiTheme({
  palette: {
    primary: {
      ...purple,
      contrastText: 'white'
    },
  },
  overrides: {
    MuiButtonBase: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1) !important'
        }
      }
    },

    MuiTouchRipple: {
      child: {
        backgroundColor: 'white'
      }
    }
  }
})

export default theme
