import { CreateProxyAgentOptions } from '~/request/createProxyAgent'
import { SupportedLanguages } from '~/utils/i18n'
import PlainPrefs from './utils/plainPrefs'

const proxyOptions: CreateProxyAgentOptions = {
  type: 'direct',
  hostname: '',
}

const _settingsPrefs = new PlainPrefs('settingsPrefs', {
  mail: '',
  password: '',
  pathOfSave: '',
  intervalOfGet: 500,
  numberOfRetry: 2,
  language: 'jp' as SupportedLanguages,
  proxy: proxyOptions
})

const settingsPrefs = _settingsPrefs.prefs

export default settingsPrefs
