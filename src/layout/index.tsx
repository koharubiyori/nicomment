import React from 'react'
import { PropsWithChildren } from 'react'
import MyAppBar from './myAppBar'
import classes from './index.scss'
export interface Props {

}

type FinalProps = PropsWithChildren<Props>

function MainLayout(props: FinalProps) {

  return (
    <div className={classes.mainLayout}>
      <MyAppBar />
      <div className="mainLayout-content">{props.children}</div>
    </div>
  )
}

export default MainLayout
