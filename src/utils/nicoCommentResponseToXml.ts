export interface Result {
  xml: string
  commentTotal: number
}

export default function nicoCommentResponseToXml(response: any[]) {
  const dataForXml = response
    .filter(item => item.chat && !item.chat.deleted)
    .map(item => item.chat)
  const xmlDocument = new Document()
  const packetEl = xmlDocument.createElement('packet')

  dataForXml.forEach(item => {
    const chatEl = xmlDocument.createElement('chat')
    chatEl.textContent = item.content

    Object.entries(item).forEach(([key, val]) => {
      if (key !== 'content') chatEl.setAttribute(key, val as any)
    })

    packetEl.append(chatEl)
  })

  xmlDocument.append(packetEl)
  const xmlDocumentBody = new XMLSerializer().serializeToString(xmlDocument)

  return {
    xml: '<?xml version="1.0" encoding="UTF-8"?>' + xmlDocumentBody,
    commentTotal: dataForXml.length
  }
}
