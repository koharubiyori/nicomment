import createIpcChannel from "../createIpcChannel"
import danmaku2ass from "../utils/danmaku2ass"

export const libsIpc = createIpcChannel('libs', {
  danmaku2ass
})

export const libsIpcClient = libsIpc.getChannelClient()
