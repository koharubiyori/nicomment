import { BrowserWindow } from 'electron';
import { windowIpc } from './modules/window'
import { dialogIpc } from './modules/dialog'
import { appIpc } from './modules/app'
import { libsIpc } from './modules/libs'

export default function initIpcHub(mainWindow: BrowserWindow) {
  [
    windowIpc,
    dialogIpc,
    appIpc,
    libsIpc
  ].forEach(item => item.initIpcChannel(mainWindow))
}
