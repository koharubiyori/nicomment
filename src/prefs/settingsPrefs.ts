import { SupportedLanguages } from '~/utils/i18n'
import PlainPrefs from './utils/plainPrefs'

const _settingsPrefs = new PlainPrefs('settingsPrefs', {
  mail: '',
  password: '',
  pathOfSave: '',
  intervalOfGet: 500,
  numberOfRetry: 2,
  language: 'jp' as SupportedLanguages,
})

const settingsPrefs = _settingsPrefs.prefs

export default settingsPrefs
