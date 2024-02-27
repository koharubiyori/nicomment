import { CircularProgress, Fab, Zoom } from '@material-ui/core'
import clsx from 'clsx'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { throttle } from 'throttle-debounce'
import nicoApi, { GetCommentsOptions } from '~/api/nico'
import { ReactComponent as NoDataIcon } from '~/assets/icons/nodata.svg'
import useStateWithRef from '~/hooks/useStateWithRef'
import settingsPrefs from '~/prefs/settingsPrefs'
import execDownloadDanmaku from '~/utils/business/downloadDanmaku'
import { useI18n } from '~/utils/i18n'
import { notify } from '~/utils/notify'
import SidePanel, { CommentsGettingOptions, DurationType, SearchFormValues, SequenceType, SettingsFormValues, ViewCountType } from './components/sidePanel'
import VideoItem, { VideoItemAction } from './components/videoItem'
import classes from './index.scss'
import CloseIcon from '@material-ui/icons/Close';
import GetAppIcon from '@material-ui/icons/GetApp';
import showDanmakuPreModal from '~/pages/danmakuPreModal'
import MultipleSelectDialog, { MultipleSelectDialogRef } from './components/multipleDownloadDialog'
import dayjs from 'dayjs'

interface SearchConfig {
  search?: SearchFormValues
  settings?: SettingsFormValues
}

function HomePage() {
  const i18n = useI18n()
  const [videoList, setVideoList, videoListRef] = useStateWithRef<any[]>([])
  const [videoListStatus, setVideoListStatus, videoListStatusRef] = useStateWithRef<LoadStatus>(1)

  const [isMultipleSelect, setIsMultipleSelect] = useState(false)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])

  const loginFlagRef = useRef(false)
  const searchConfigRef = useRef<SearchConfig>({
    search: undefined,
    settings: settingsPrefs
  })
  const commentsGettingOptionsRef = useRef<CommentsGettingOptions>()
  const videoListElRef = useRef<HTMLDivElement>()
  const multipleDownloadDialogRef = useRef<MultipleSelectDialogRef>()

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

  useEffect(() => {
    selectedVideoIds.length === 0 && setIsMultipleSelect(false)
  }, [selectedVideoIds])

  function login(mail: string, password: string) {
    notify(i18n.tryLoginHint)
    return nicoApi.login(mail, password)
      .then((result) => {
        if (result) {
          loginFlagRef.current = true
          notify.success(i18n.loginSuccessHint)
        } else {
          notify.error(i18n.loginFailHint)
          throw { netErr: true }
        }
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

  function createGetCommentOptions(): GetCommentsOptions {
    let dateForGettingComments = commentsGettingOptionsRef.current?.date
    if (dateForGettingComments && dateForGettingComments.isSame(dayjs(), 'day')) dateForGettingComments = null
    const getCommentsOptions: GetCommentsOptions = {
      ...(dateForGettingComments ? { when: Math.floor(dateForGettingComments!.toDate().getTime() / 1000) } : {})
    }

    return getCommentsOptions
  }

  async function downloadDanmaku(id: string, title?: string) {
    if (!searchConfigRef.current.settings?.mail || !searchConfigRef.current.settings.password) {
      return notify(i18n.emptyLoginInfoHint)
    }

    try {
      if (!loginFlagRef.current) await login(
        searchConfigRef.current.settings!.mail,
        searchConfigRef.current.settings!.password
      )

      const titleToShow = title?.replace(/^([\s\S]{15})[\s\S]+$/, '$1...') ?? id
      notify(i18n.startHintOfDownloadComments + titleToShow, ['top', 'right'])

      const result = await execDownloadDanmaku(id, {
        title,
        savePath: searchConfigRef.current.settings!.pathOfSave,
        getCommentsOptions: createGetCommentOptions()
      })

      if (result.success) {
        notify.success(i18n.successHintOfDownloadComments(result.videoInfo!.video.title, result.fileContent!.commentTotal), ['top', 'right'])
      } else if (result.type === 'downloadFileFailed') {
        notify.error(i18n.failHintOfDownloadComments, ['top', 'right'])
      } else if (result.type === 'saveFileFailed') {
        notify.error(i18n.failHintOfSaveComments, ['top', 'right'])
      }
    } catch(e) {
      console.log(e)
      notify.error(i18n.failHintOfDownloadComments, ['top', 'right'])
    }
  }

  function toggleItemSelect(videoId: string) {
    setSelectedVideoIds(prevVal => {
      return prevVal.includes(videoId) ?
        prevVal.filter(item => item !== videoId) :
        Array.from(new Set(prevVal.concat([videoId])))
    })
  }

  async function handleOnVideoItemClick(action: VideoItemAction, itemData: any) {
    if (action === 'showDanmakuPreModal') {
      if (!searchConfigRef.current.settings?.mail || !searchConfigRef.current.settings.password) {
        return notify(i18n.emptyLoginInfoHint)
      }

      try {
        if (!loginFlagRef.current) await login(
          searchConfigRef.current.settings!.mail,
          searchConfigRef.current.settings!.password
        )
      } catch (e) {
        console.log(e)
        notify.error(i18n.failHintOfDownloadComments, ['top', 'right'])
      }

      showDanmakuPreModal({
        danmakuData: itemData,
        savePath: searchConfigRef.current.settings!.pathOfSave
      })
    }
    if (action === 'gotoVideoContent') {
      window.open('https://nico.ms/' + itemData.contentId)
    }
  }

  function executeMultipleDownload() {
    if (!searchConfigRef.current.settings?.mail || !searchConfigRef.current.settings.password) {
      return notify(i18n.emptyLoginInfoHint)
    }

    multipleDownloadDialogRef.current?.show({
      videoList: selectedVideoIds.map(id => {
        const foundVideoItem = videoList.find(videoItem => videoItem.contentId === id)
        return {
          id,
          title: foundVideoItem.title,
          thumbnail: foundVideoItem.thumbnailUrl
        }
      }),
      pathOfSave: searchConfigRef.current.settings!.pathOfSave,
      getCommentsOptions: createGetCommentOptions()
    })
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
        onUpdateCommentGettingOptions={options => commentsGettingOptionsRef.current = options}
        onAccountInfoChange={() => loginFlagRef.current = false}
        onSettingsChange={settings => searchConfigRef.current.settings = settings}
        onCodeSearch={code => downloadDanmaku(code, code)}
      />
      <div className="videoListContainer flex flex-column-limit">
        <div className="videoList" ref={videoListElRef as any}>
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
            <div key={item.contentId} className="flex-row flex-cross-center">
              <VideoItem
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
                checked={selectedVideoIds.includes(item.contentId)}
                multipleSelect={isMultipleSelect}
                onClick={() => {
                  isMultipleSelect ?
                    toggleItemSelect(item.contentId) :
                    downloadDanmaku(item.contentId, item.title)
                }}
                onActionClick={(action) => handleOnVideoItemClick(action, item)}
                onMultipleSelectActivate={() => {
                  setIsMultipleSelect(true)
                  toggleItemSelect(item.contentId)
                }}
              />
            </div>
          )}

          <Zoom in={isMultipleSelect}>
            <div className="fabContainer" style={{ right: 130 }}>
              <Fab color="primary" size="small" onClick={executeMultipleDownload}>
                <GetAppIcon />
              </Fab>
            </div>
          </Zoom>

          <Zoom in={isMultipleSelect}>
            <div className="fabContainer" style={{ right: 80 }}>
              <Fab className="fab" color="secondary" size="small" onClick={() => setSelectedVideoIds([])}>
                <CloseIcon />
              </Fab>
            </div>
          </Zoom>

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

      <MultipleSelectDialog getRef={multipleDownloadDialogRef} />
    </div>
  )
}

export default HomePage
