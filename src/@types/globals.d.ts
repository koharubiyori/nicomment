declare module '*.svg' {
  import * as React from 'react'
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
}

declare module '~/styles/globals.scss' {
  const module: any
  export default module;
}

declare type LoadStatus =
    0   // 加载失败
  | 1   // 初始状态
  | 2   // 加载中
  | 2.1 // 首次加载中
  | 3   // 加载成功
  | 4   // 加载成功，且已经全部加载完毕(列表用)
  | 5   // 加载了，但没有数据
