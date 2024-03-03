export interface Result {
  xml: string
  commentTotal: number
}

export interface NicoCommentsToXmlOptions {
  processDanmakuData?: (data: any) => any
}

export default function nicoCommentsToXml(comments: any, options?: NicoCommentsToXmlOptions) {
  let dataToConvertToXml = comments
    .reduce((result: any[], item: any) => result.concat(item.comments), [])

  dataToConvertToXml = (options?.processDanmakuData ?? ((data: any) => data))(dataToConvertToXml)
  const xmlDocument = new Document()
  const packetEl = xmlDocument.createElement('packet')

  dataToConvertToXml.forEach((item: any) => {
    const chatEl = xmlDocument.createElement('chat')
    // 模仿niconico旧版api返回的xml格式
    const attributes = {
      thread: '1',    // item里没有，虽然可以从response里查，但没有必要，只会增加处理负担
      no: item.no,
      vpos: Math.round(item.vposMs / 10),
      date: Math.round(new Date(item.postedAt).getTime() / 1000),
      date_usec: '',
      nicoru: item.nicoruCount,
      anonymity: 1,
      valhalla: 1,
      user_id: item.userId,
      score: item.score,
      mail: item.commands.join(' ')
    }

    chatEl.textContent = item.body

    Object.entries(attributes).forEach(([key, val]) => chatEl.setAttribute(key, val as any))
    packetEl.append(chatEl)
  })

  xmlDocument.append(packetEl)
  const xmlDocumentBody = new XMLSerializer().serializeToString(xmlDocument)

  return {
    xml: '<?xml version="1.0" encoding="UTF-8"?>' + xmlDocumentBody,
    commentTotal: dataToConvertToXml.length
  }
}
