import clsx from 'clsx'
import React, { useEffect, useRef, useState } from 'react'
import SidePanel, { SequenceType, SearchFormValues, SettingsFormValues, DurationType, ViewCountType } from './components/sidePanel'
import classes from './index.scss'
import { ReactComponent as NoDataIcon } from '~/assets/icons/nodata.svg'
import nicoApi from '~/api/nico'
import { notify } from '~/utils/notify'
import Skeleton from 'react-loading-skeleton'
import VideoItem from './components/videoItem'
import moment from 'moment'
import settingsPref from '~/prefs/settingsPref'
import { CircularProgress } from '@material-ui/core'
import useStateWithRef from '~/hooks/useStateWithRef'
import { throttle } from 'throttle-debounce'
import nicoCommentResponseToXml from '~/utils/nicoCommentResponseToXml'
import fs, { constants } from 'fs'
import path from 'path'
import { useI18n } from '~/utils/i18n'

interface SearchConfig {
  search?: SearchFormValues
  settings?: SettingsFormValues
}

function HomePage() {
  const i18n = useI18n()
  const [videoList, setVideoList, videoListRef] = useStateWithRef([])
  // 1:初始化，2：加载，2.1：初始化加载，3：完成，4：全部加载完成，5：空内容
  const [videoListStatus, setVideoListStatus, videoListStatusRef] = useStateWithRef<1 | 2 | 2.1 | 3 | 4 | 5>(1)
  const loginFlagRef = useRef(false)
  const searchConfigRef = useRef<SearchConfig>({
    search: undefined,
    settings: settingsPref
  })
  const videoListElRef = useRef<HTMLDivElement>()

  useEffect(() => {
    const throttledSearch = throttle(1000, () => search(undefined, true))
    const handler = () => {
      const containerContainerHeight = videoListElRef.current!.clientHeight
      const containerContentHeight = videoListElRef.current!.scrollHeight
      const distanceFromBottom = containerContentHeight - containerContainerHeight - videoListElRef.current!.scrollTop
      if (distanceFromBottom < 100 && videoListStatusRef.current === 3) throttledSearch()
    }

    videoListElRef.current!.addEventListener('scroll', handler)
    return () => videoListElRef.current?.removeEventListener('scroll', handler)
  }, [])

  function login(mail: string, password: string) {
    notify(i18n.tryLoginHint)
    return nicoApi.login(mail, password)
      .then(() => {
        loginFlagRef.current = true
        notify.success(i18n.loginSuccessHint)
      })
      .catch(e => {
        console.log(e)
        notify.error(i18n.loginFailHint)
        throw e
      })
  }

  async function search(searchFormValues?: SearchFormValues, next = false) {
    if (videoListStatusRef.current === 2 || videoListStatusRef.current === 2.1) { return }

    searchFormValues ??= searchConfigRef.current.search
    searchConfigRef.current.search = searchFormValues

    const sortKeyMap: { [Type in SequenceType]: string } = {
      commentMost: '-commentCounter',
      commentLeast: '+commentCounter',
      publishLatest: '-startTime',
      publishEarliest: '+startTime',
      viewMost: '-viewCounter',
      viewLeast: '+viewCounter',
      commentLatest: '-lastCommentTime',
      commentEarliest: '+lastCommentTime',
      mylistMost: '-mylistCounter',
      mylistLeast: '+mylistCounter',
      durationMost: '-lengthSeconds',
      durationLeast: '+lengthSeconds',
    }

    const durationFilterMap: { [Type in DurationType]: any } = {
      none: null,
      '5-': { from: 0, to: 5 * 60 },
      '5-20': { form: 5 * 60, to: 20 * 60 },
      '20-60': { from: 20 * 60, to: 60 * 60 },
      '60+': { from: 60 * 60 },
    }

    const viewCountFilterMap: { [Type in ViewCountType]: any } = {
      none: null,
      '1k-': { from: 0, to: 1000 },
      '1k-5k': { from: 1000, to: 5000 },
      '5k - 50k': { from: 5000, to: 50 * 1000 },
      '50k - 100k': { from: 50 * 1000, to: 100 * 1000 },
      '100k - 500k':  { from: 100 * 1000, to: 500 * 1000 },
      '500k+': { from: 500 * 1000 }
    }

    const jsonFilter = { type: 'and', filters: [] as any[] }
    if (searchFormValues!.duration !== 'none') {
      jsonFilter.filters.push({
        type: 'range',
        field: 'lengthSeconds',
        ...(durationFilterMap[searchFormValues!.duration]),
        include_lower: true,
        include_upper: true
      })
    }

    if (searchFormValues!.viewCount !== 'none') {
      jsonFilter.filters.push({
        type: 'range',
        field: 'viewCounter',
        ...(viewCountFilterMap[searchFormValues!.viewCount]),
        include_lower: true,
        include_upper: true
      })
    }

    !next && setVideoList([])
    setVideoListStatus(next ? 2 : 2.1)
    nicoApi.search({
      q: searchFormValues!.keyword,
      targets: 'title,description,tags',
      fields: 'contentId,title,description,viewCounter,mylistCounter,likeCounter,lengthSeconds,thumbnailUrl,startTime,commentCounter,tags',
      _sort: sortKeyMap[searchFormValues!.sequence],
      _limit: 20,
      _offset: next ? videoListRef.current.length : 0,
      ...(jsonFilter.filters.length !== 0 ? {
        jsonFilter: JSON.stringify(jsonFilter)
      } : {})
    }).json()
      .then((data: any) => {
        let nextStatus = 3
        if (videoListRef.current.length === 0 && data.data.length === 0) nextStatus = 5
        if (videoListRef.current.length !== 0 && data.data.length === 0) nextStatus = 4

        setVideoList(next ? videoListRef.current.concat(data.data) : data.data)
        setVideoListStatus(nextStatus as any)

        if (nextStatus === 5) {
          notify.success(i18n.emptyHintOfSearchResult)
        }
      })
      .catch(e => {
        console.log(e)
        setVideoListStatus(videoListRef.current.length !== 0 ? 3 : 1)
      })
  }

  async function downloadDanmaku(id: string, title?: string) {
    if (!loginFlagRef.current) await login(
      searchConfigRef.current.settings!.mail,
      searchConfigRef.current.settings!.password
    )

    const displayTitle = title?.replace(/^([\s\S]{15})[\s\S]+$/, '$1...') ?? id
    notify(i18n.startHintOfDownloadComments + displayTitle, ['top', 'right'])
    try {
      const videoInfo = await nicoApi.getVideoInfo(id)
      const comments = (await nicoApi.getComments(videoInfo)) as any[]
      const fileContent = nicoCommentResponseToXml(comments)
      const fileDir = searchConfigRef.current.settings!.pathOfSave
      const filePath = path.join(fileDir, videoInfo.video.title + '.xml')

      const isDirExists = await new Promise<boolean>(resolve => fs.access(fileDir, constants.F_OK, err => resolve(!err)))

      // 如果保存目录不存在，创建目录
      if (!isDirExists) {
        await new Promise<void>((resolve, reject) => fs.mkdir(fileDir, { recursive: true }, e => e ? reject() : resolve()))
      }

      try {
        await new Promise<void>((resolve, reject) => fs.writeFile(filePath, fileContent.xml, (e) => e ? reject() : resolve()))
        notify.success(i18n.successHintOfDownloadComments(videoInfo.video.title, fileContent.commentTotal), ['top', 'right'])
      } catch(e) {
        console.log(e)
        notify.error(i18n.failHintOfSaveComments, ['top', 'right'])
      }
    } catch(e) {
      console.log(e)
      notify.error(i18n.failHintOfDownloadComments, ['top', 'right'])
    }
  }

  function formatDuration(seconds: number) {
    if (seconds < 60) {
      return seconds + i18n.second
    } else {
      const duration = moment.duration(seconds, 'second')
      const remainderSeconds = duration.seconds()
      return Math.floor(duration.asMinutes()) + i18n.minute + (remainderSeconds !== 0 ? remainderSeconds + i18n.second : '')
    }
  }

  return (
    <div className={clsx(classes.container, 'flex-row')}>
      <SidePanel
        onSearch={search}
        onSettingsChange={settings => searchConfigRef.current.settings = settings}
        onCodeSearch={code => downloadDanmaku(code, code)}
      />
      <div className="videList flex flex-column-limit" ref={videoListElRef as any}>
        {videoListStatus === 1 &&
          <div className="noData flex flex-column flex-center">
            <NoDataIcon style={{ width: 200, height: 200, fill: '#ccc' }} />
            <div className="hintText">{i18n.doSearchPlease}</div>
          </div>
        }

        {videoListStatus === 2.1 &&
          new Array(20).fill(0).map((_, index) =>
            <Skeleton key={index} height={100} style={{ marginBottom: 10 }} />
          )
        }

        {videoList.map((item: any) =>
          <VideoItem
            key={item.contentId}
            title={item.title}
            description={item.description}
            duration={formatDuration(item.lengthSeconds)}
            thumbnailUrl={item.thumbnailUrl}
            likeCount={item.likeCounter}
            commentCount={item.commentCounter}
            viewCount={item.viewCounter}
            mylistCount={item.mylistCounter}
            publishTime={moment(item.startTime).format(i18n.basicDateFormatForMoment)}
            tags={item.tags.split(' ')}
            onClick={() => downloadDanmaku(item.contentId, item.title)}
          />
        )}

        {videoListStatus === 2 &&
          <div className="flex-row flex-center" style={{ height: 50 }}>
            <CircularProgress />
          </div>
        }
        {videoListStatus === 4 &&
          <div className="allLoaded">{i18n.allLoadedHintOfSearchResult}</div>
        }
      </div>
    </div>
  )
}

export default HomePage
