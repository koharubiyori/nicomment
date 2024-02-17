import { dialog, OpenDialogOptions } from 'electron'
import createIpcChannel from '../createIpcChannel'

export const dialogIpc = createIpcChannel('dialog', {
  showFilesSelectDialog(options: OpenDialogOptions) {
    return dialog.showOpenDialog(this, options)
  }
})

export const dialogIpcClient = dialogIpc.getChannelClient()
