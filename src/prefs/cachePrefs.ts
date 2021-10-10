import PlainPrefs from './utils/plainPrefs'

const _cachePrefs = new PlainPrefs('cachePrefs', {
  searchHistory: [] as string[]
})

const cachePrefs = _cachePrefs.prefs

export default cachePrefs
