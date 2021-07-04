import clsx from 'clsx'
import React from 'react'
import { NicoSearchOptions } from '~/api/nico'
import classes from './index.scss'

export interface Props {
  onSearch(form: NicoSearchOptions): void
}

function SidePanel(props: Props) {
  return (
    <div className={clsx(classes.sideMenuContainer, 'flex-column')}>

      {/* <div className="logo">Nicoment</div>
      <div className="flex-limit">
        <TextField id="standard-basic" label="Standard" />
      </div> */}
    </div>
  )
}

export default SidePanel
