import { Agents } from 'got/dist/source'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

export interface CreateProxyAgentOptions {
  type: 'direct' | 'http' | 'socks'
  hostname: string
  port?: number
  username?: string
  password?: string
}

function createProxyAgent(config: CreateProxyAgentOptions): Agents {
  const commonConfig = {
    hostname: config.hostname,
    port: config.port,
    auth: `${config.username}:${config.password}`
  }

  const proxyAgent = config.type === 'http' ?
    new HttpsProxyAgent(commonConfig) :
    new SocksProxyAgent(commonConfig)

  return { https: proxyAgent }
}

export default createProxyAgent
