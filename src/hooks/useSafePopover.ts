import { useEffect } from 'react'
import { MyAppBarHeight } from '~/layout/myAppBar'

// 解决Select组件弹出的选择框定位在app头栏上导致选项无法选中的问题
export default function useSafePopover() {
  useEffect(() => {
    const adjustTopOffset: MutationCallback = (record) => {
      record
        .flatMap(item => Array.from(item.addedNodes))
        .forEach((item: any) => {
          if (item.classList.contains('MuiPopover-root') === false) { return }
          const popoverBody: HTMLDivElement = item.querySelector('.MuiPopover-paper')
          if (parseInt(getComputedStyle(popoverBody).top) >= MyAppBarHeight + 5) { return }
          popoverBody.style.top = MyAppBarHeight + 5 + 'px'
        })

    }

    const observer = new MutationObserver(adjustTopOffset)
    observer.observe(document.body, {
      childList: true
    })

    return () => observer.disconnect()
  }, [])
}
