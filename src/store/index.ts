import { configure } from 'mobx'
import AppBarStore from './appBar'

configure({ enforceActions: 'observed' })

const store = {
  appBar: new AppBarStore()
}

export default store
