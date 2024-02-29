import path from "path"
import fsPromise from 'fs/promises'
import { appIpcClient } from "~/ipcHub/modules/app"

export function isValidRegExp(pattern: string) {
  try {
    new RegExp(pattern)
    return true
  } catch(e) {
    return false
  }
}

export async function writeInLogs(filename: string, content: string) {
  const appPath = await appIpcClient.call('getAppPath')
  const logDirPath = path.join(appPath, 'logs')
  await fsPromise.mkdir(logDirPath).catch((e: any) => { if (e.code !== 'EEXIST') throw e })
  const logFilePath = path.join(appPath, 'logs', filename + '.log')
  await fsPromise.writeFile(logFilePath, content, 'utf8')
}
