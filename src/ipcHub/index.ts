import { BrowserWindow } from 'electron';
import { windowIpc } from './modules/window'

export default function initIpcHub(mainWindow: BrowserWindow) {
  windowIpc.initIpcChannel(mainWindow)
}
