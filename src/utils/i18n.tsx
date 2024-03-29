import React, { createContext, PropsWithChildren } from 'react'
import { useContext } from 'react'
import { useState } from 'react'
import languages from '~/languages'

const i18nContext = createContext<SupportedLanguages>('zh')

export type SupportedLanguages = 'zh' | 'jp'

export interface I18nProviderProps {
  defaultLanguage?: SupportedLanguages
}

let setLanguageFn: React.Dispatch<React.SetStateAction<SupportedLanguages>> = null!
let currentLanguage: SupportedLanguages = 'zh'

export function I18nProvider(props: PropsWithChildren<I18nProviderProps>) {
  const [language, setLanguage] = useState<SupportedLanguages>(props.defaultLanguage ?? currentLanguage)
  setLanguageFn = setLanguage

  return (
    <i18nContext.Provider value={language}>{props.children}</i18nContext.Provider>
  )
}

export function setCurrentLanguage(language: SupportedLanguages) {
  currentLanguage = language
  if (setLanguageFn !== null) setLanguageFn(language)
}

export function useCurrentLanguage() {
  return useContext(i18nContext)
}

export function useI18n() {
  const currentLanguage = useCurrentLanguage()
  return languages[currentLanguage]
}

export function globalI18n() {
  return languages[currentLanguage]
}
