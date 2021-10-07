import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import Promiser from '~/utils/promiser'

type UnRegisterRootChild = () => void

export interface RootParentClient {
  registerRootChild(content: JSX.Element): UnRegisterRootChild
}

const RootParentContext = createContext<RootParentClient>(null as any)

export default function useRootParent() {
  return useContext(RootParentContext)
}

let _rootParentClient: RootParentClient = null as any
const rootParentClientPromiser = new Promiser<RootParentClient>()
const rootParentClientFullback = createRootParentClientFullback()   // 在没有根父级组件的时候（可能是还未渲染完毕，或干脆没有使用），则使用后备client

// 这个set用于收集registeredChildren的setter，当作provider的标记使用，第一个标记一定是最外层的provider。
// 当找到最外层provider后，如果后备client中已经存在children，则会与最外层provider中的children合并，并销毁后备client。
let settersOfRegisteredChildren = new Set<(children: JSX.Element[]) => void>()

export function globalRootParent() {
  return _rootParentClient ?? rootParentClientFullback.client
}

globalRootParent.promise = rootParentClientPromiser.promise

function useChildrenRegister() {
  const [registeredChildren, setRegisteredChildren] = useState<JSX.Element[]>([])

  const rootParentClient: RootParentClient & { setChildren: React.Dispatch<React.SetStateAction<JSX.Element[]>> } = {
    registerRootChild: (content) => {
      setRegisteredChildren(prevVal => prevVal.concat([content]))
      return () => setRegisteredChildren(prevVal => prevVal.filter(item => item !== content))
    },
    setChildren: setRegisteredChildren
  }

  return {
    registeredChildren,
    rootParentClient
  }
}

export function RootParentProvider(props: PropsWithChildren<{}>) {
  const { registeredChildren, rootParentClient } = useChildrenRegister()

  useEffect(() => {
    if (settersOfRegisteredChildren && Array.from(settersOfRegisteredChildren)[0] === rootParentClient.setChildren) {
      rootParentClient.setChildren(prevVal => [...rootParentClientFullback.registeredChildren.current!, ...prevVal])
      rootParentClientFullback.unmount()
      settersOfRegisteredChildren = null as any
    }
  }, [])

  settersOfRegisteredChildren?.add(rootParentClient.setChildren)
  rootParentClientPromiser.resolve(rootParentClient)
  _rootParentClient ??= rootParentClient

  return <RootParentContext.Provider value={rootParentClient}>
    {props.children}
    {registeredChildren}
  </RootParentContext.Provider>
}

function createRootParentClientFullback() {
  const containerEl = document.createElement('div')
  containerEl.id = 'rootParent-fullback-container'
  document.body.append(containerEl)

  let _registeredChildren = { current: null as any as JSX.Element[] }
  let fullbackClient: RootParentClient = null as any
  ReactDOM.render(<RootParentFullBack />, containerEl)

  function RootParentFullBack() {
    const { registeredChildren, rootParentClient } = useChildrenRegister()

    _registeredChildren.current = registeredChildren
    fullbackClient = rootParentClient

    return React.cloneElement(<></>, {}, ...registeredChildren)
  }

  return {
    client: fullbackClient,
    registeredChildren: _registeredChildren,
    unmount: () => {
      ReactDOM.unmountComponentAtNode(containerEl)
      containerEl.remove()
    }
  }
}
