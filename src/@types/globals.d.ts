declare module 'axios/lib/adapters/http' {
  const module: any
  export default module;
}
declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

  const src: string;
  export default src;
}
