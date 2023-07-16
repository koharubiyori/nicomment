import { createMuiTheme } from '@material-ui/core'
import indigo from '@material-ui/core/colors/indigo'

const theme = createMuiTheme({
  palette: {
    primary: indigo,
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
