import React from 'react'
import { PropsWithChildren } from 'react'
import MyAppBar, { MyAppBarHeight } from './myAppBar'
import classes from './index.scss'
export interface Props {

}

type FinalProps = PropsWithChildren<Props>

function MainLayout(props: FinalProps) {

  const cssVariableStyle: any = { '--myAppBarHeight': MyAppBarHeight + 'px' }

  return (
    <div className={classes.mainLayout} style={cssVariableStyle}>
      <MyAppBar />
      <div className="mainLayout-content">{props.children}</div>
    </div>
  )
}

export default MainLayout
