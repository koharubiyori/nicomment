import { OptionsObject, SnackbarKey, SnackbarProvider, SnackbarProviderProps, closeSnackbar, enqueueSnackbar } from 'notistack'
import React, { ReactNode, useLayoutEffect, useRef } from 'react'

export type NotifyType = 'default' | 'info' | 'success' | 'warning' | 'error'
export type NotifyPositions = ['top' | 'bottom', 'left' | 'center' | 'right']
export type NotifyOptions = OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'>

export interface Notify {
  (message: string, position?: NotifyPositions): void
  (message: string, options?: NotifyOptions): void

  success (message: string, position?: NotifyPositions): void
  success (message: string, options?: NotifyOptions): void

  info (message: string, position?: NotifyPositions): void
  info (message: string, options?: NotifyOptions): void

  warning (message: string, position?: NotifyPositions): void
  warning (message: string, options?: NotifyOptions): void

  error (message: string, position?: NotifyPositions): void
  error (message: string, options?: NotifyOptions): void
}

export let notify: Notify = null!

export interface NotifyProviderProps extends SnackbarProviderProps {}

export function NotifyProvider(props: NotifyProviderProps) {
  const snackbarRef = useRef<any>()

  useLayoutEffect(() => {
    const msg = snackbarRef.current.enqueueSnackbar!

    const createOptions = (
      type: NotifyType = 'default',
      positionOrOptions: NotifyPositions = ['top', 'center'],
      autoHideDuration = 3000
    ) => {
      const defaultOptions = {
        variant: type,
        anchorOrigin: { vertical: positionOrOptions[0], horizontal: positionOrOptions[1] },
        autoHideDuration
      }

      if (Array.isArray(positionOrOptions)) {
        return defaultOptions
      } else {
        return {
          ...defaultOptions,
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          ...(positionOrOptions as any)
        }
      }
    }

    let notifyClient: any = (message: any, position?: any) => msg(message, createOptions('default', position))
    notifyClient.info = (message: any, position?: any) => msg(message, createOptions('info', position))
    notifyClient.success = (message: any, position?: any) => msg(message, createOptions('success', position))
    notifyClient.warning = (message: any, position?: any) => msg(message, createOptions('warning', position))
    notifyClient.error = (message: any, position?: any) => msg(message, createOptions('error', position))

    notify = notifyClient
  }, [])

  return (
    <SnackbarProvider
      {...props}
      ref={snackbarRef}
    />
  )
}

export function createTextUpdatableNotify(message: ReactNode, options?: OptionsObject<'default' | 'error' | 'success' | 'warning' | 'info'> | undefined) {
  const textRef = React.createRef<HTMLSpanElement>()
  const key = enqueueSnackbar(<span ref={textRef}>{message}</span>, { ...options, persist: true })
  return {
    updateText: (content: string) => textRef.current!.textContent = content,
    close: () => closeSnackbar(key)
  }
}
