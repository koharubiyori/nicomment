import React, { PropsWithChildren, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import Promiser from '~/utils/promiser'

type UnRegisterRootChild = () => void

export interface RootParentClient {
  registerRootChild(content: JSX.Element): UnRegisterRootChild
}

let _rootParentClient: RootParentClient = null as any
const rootParentClientPromiser = new Promiser<RootParentClient>()
const rootParentClientFullback = createRootParentClientFullback()   // 在没有根父级组件的时候（可能是还未渲染完毕，或干脆没有使用），则使用后备client

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

export function RootParentBase(props: PropsWithChildren<{}>) {
  const { registeredChildren, rootParentClient } = useChildrenRegister()

  useEffect(() => {
    rootParentClient.setChildren(prevVal => [...rootParentClientFullback.registeredChildren.current!, ...prevVal])
    rootParentClientFullback.unmount()
  }, [])

  rootParentClientPromiser.resolve(rootParentClient)
  _rootParentClient ??= rootParentClient

  return <>
    {props.children}
    {registeredChildren}
  </>
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
