import storage from '~/utils/storage'

const storageKey = 'settings'

const originalObj = {
  mail: '',
  password: '',
  pathOfSave: '',
  intervalOfGet: 500,
  numberOfRetry: 2
}

export type SettingsPref = typeof originalObj

export function initSettingsPref() {
  const currentData = storage.get(storageKey)
  if (currentData === null) { return }

  for (let [key, value] of Object.entries(currentData)) {
    ;(originalObj as any)[key] = value
  }
}

const settingsPref: SettingsPref = new Proxy(originalObj, {
  get(target: any, getter: string) {
    return target[getter]
  },

  set(target: any, key: string, value: any) {
    target[key] = value
    storage.set(storageKey, target)
    return true
  }
})

export default settingsPref
