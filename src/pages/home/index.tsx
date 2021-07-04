import clsx from 'clsx'
import React from 'react'
import SidePanel from './components/sidePanel'
import classes from './index.scss'


function HomePage() {
  // useEffect(() => {
  //   ;(async () => {
  //     await nicoApi.login('2665611998@qq.com', 'zhang18640311631')
  //     const videoInfo = await nicoApi.getVideoInfo('so23335421')
  //     // console.log(videoInfo)
  //     nicoApi.getComments(videoInfo)
  //     .then(data => {
  //       console.log(data)
  //     })
  //   })()
  // }, [])

  return (
    <div className={clsx(classes.container, 'flex-row')}>
      <SidePanel onSearch={() => {}} />
    </div>
  )
}

export default HomePage
