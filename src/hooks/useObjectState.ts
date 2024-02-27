import { Dispatch, SetStateAction, useState } from "react"

type ObjectState = Record<string | number, any>
export type ObjectStateSetter<T extends ObjectState, K extends keyof T = keyof T> = (key: K, value: T[K]) => void

export default function useObjectState<S extends ObjectState>(initialState: S | (() => S)):
[S, ObjectStateSetter<S>, Dispatch<SetStateAction<S>>]  {
  const [state, setState] = useState(initialState)
  const objectSetter: ObjectStateSetter<typeof state> = (key, value) => setState(prevVal => ({ ...prevVal, [key]: value }))

  return [state, objectSetter, setState]
}
