import { BrowserWindow } from 'electron';
import { windowIpc } from './modules/window'
import { dialogIpc } from './modules/dialog'
import { appIpc } from './modules/app'

export default function initIpcHub(mainWindow: BrowserWindow) {
  [
    windowIpc,
    dialogIpc,
    appIpc
  ].forEach(item => item.initIpcChannel(mainWindow))
}
