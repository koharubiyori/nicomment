import { Dialog, DialogTitle } from '@material-ui/core'
import React, { createContext, useState } from 'react'
import ReactDOM from 'react-dom'
import { globalRootParent } from '~/utils/rootParent'
import { useI18n } from '~/utils/i18n'
import classes from './index.scss'

export interface Props {

}

let setIsOpenExternalRefer: React.Dispatch<React.SetStateAction<boolean>> = null as any

export function showSettingsModal() {
  setIsOpenExternalRefer(true)
}

function SettingsModal(props: Props) {
  const i18n = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  setIsOpenExternalRefer = setIsOpen

  if (!i18n) return null
  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <DialogTitle>{i18n.settings}</DialogTitle>
      <div className={classes.title}></div>
    </Dialog>
  )
}

export default SettingsModal


globalRootParent().registerRootChild(<SettingsModal />)
