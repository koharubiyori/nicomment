import { app, App } from 'electron'
import createIpcChannel from '../createIpcChannel'

export const appIpc = createIpcChannel('app', {
  call(method: keyof App, ...args: any[]) {
    return (app[method] as any)(...args)
  }
})

export const appIpcClient = appIpc.getChannelClient()
