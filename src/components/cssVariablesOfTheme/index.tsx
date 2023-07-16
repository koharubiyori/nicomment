import { useTheme } from '@material-ui/core'
import React, { PropsWithChildren } from 'react'

export interface Props {

}

function CssVariablesOfTheme(props: PropsWithChildren<Props>) {
  const theme = useTheme()

  const cssVariables = {
    '--primary': theme.palette.primary.main,
    '--success': theme.palette.success.main,
    '--error': theme.palette.error.main,
    '--warning': theme.palette.warning.main,
    '--info': theme.palette.info.main,

    '--text-primary': theme.palette.text.primary,
    '--text-secondary': theme.palette.text.secondary,
    '--text-disabled': theme.palette.text.disabled,

    '--background-default': theme.palette.background.default,
    '--background-paper': theme.palette.background.paper
  }

  return <div className="cssVariablesOfTheme" style={cssVariables as any}>{props.children}</div>
}

export default CssVariablesOfTheme


