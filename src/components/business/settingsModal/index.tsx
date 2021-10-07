import { Dialog, DialogTitle } from '@material-ui/core'
import React, { createContext, useState } from 'react'
import ReactDOM from 'react-dom'
import { globalRootParent } from '~/hooks/useRootParent'
import { useI18n } from '~/utils/i18n'

export interface Props {

}

export interface SettingsModalClient {
  show(): void
}

// let settingsModal =

function SettingsModal(props: Props) {
  const i18n = useI18n()
  const [isOpen, setIsOpen] = useState(true)

  return <div>123</div>
  // return (
  //   <Dialog
  //     open={isOpen}
  //   >
  //     <DialogTitle>123</DialogTitle>
  //   </Dialog>
  // )
}

export default SettingsModal

export function showSettingsModal() {
  const unregister = globalRootParent().registerRootChild(<SettingsModal />)
}
