import { IconButton, Typography } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import MinimizeIcon from '@material-ui/icons/Minimize'
import clsx from 'clsx'
import { useObserver } from 'mobx-react-lite'
import React from 'react'
import { ReactComponent as MaximizeIcon } from '~/assets/icons/maximize.svg'
import { ReactComponent as ShrinkIcon } from '~/assets/icons/shrink.svg'
import { windowIpcClient } from '~/ipcHub/modules/window'
import store from '~/store'
import classes from './index.scss'

function MyAppBar() {

  async function toggleMaximize() {
    store.appBar.setIsWindowMaximized(await windowIpcClient.toggleMaximize())
  }

  return useObserver(() =>
    <div className={clsx(classes.myAppBar)}>
      <div className="contentContainer flex-row flex-between flex-cross-center com-drag">
        <Typography variant="h6" className="title">{store.appBar.title}</Typography>
        <div className="rightButtons flex-row-inline flex-cross-center com-noDrag">
          <IconButton className="com-noDrag iconButton" onClick={() => windowIpcClient.minimize()}>
            <MinimizeIcon fontSize="small" style={{ color: 'white' }} />
          </IconButton>
          <IconButton className="com-noDrag iconButton" onClick={toggleMaximize}>
            {store.appBar.isWindowMaximized
              ? <ShrinkIcon style={{ minWidth: 20, minHeight: 20, fill: 'white' }} />
              : <MaximizeIcon style={{ minWidth: 16, minHeight: 16, fill: 'white' }} />
            }
          </IconButton>
          <IconButton className="com-noDrag iconButton" onClick={() => windowIpcClient.close()}>
            <CloseIcon fontSize="small" style={{ color: 'white' }} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

export default MyAppBar
