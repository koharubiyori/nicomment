import { windowIpcClient } from '~/ipcHub/modules/window'
import { debounce } from '@material-ui/core'
import { action, observable, runInAction } from 'mobx'

class AppBarStore {
  @observable title = 'Nicomment'
  @observable isWindowMaximized = false

  constructor() {
    window.addEventListener('resize', debounce(this.checkIsMaximized, 200))
  }

  @action.bound
  setTitle(title: string) {
    this.title = title
  }

  @action.bound
  setIsWindowMaximized(isWindowMaximized: boolean) {
    this.isWindowMaximized = isWindowMaximized
  }

  @action.bound
  checkIsMaximized() {
    windowIpcClient.isMaximized().then(isMaximized => {
      runInAction(() => this.isWindowMaximized = isMaximized)
    })
  }
}

export default AppBarStore
