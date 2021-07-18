import { ButtonBase } from '@material-ui/core'
import clsx from 'clsx'
import React from 'react'
import { useI18n } from '~/utils/i18n'
import classes from './index.scss'

export interface Props {
  thumbnailUrl: string
  title: string
  description: string
  viewCount: string
  likeCount: string
  mylistCount: string
  commentCount: string
  duration: string
  publishTime: string
  tags: string[]
  onClick(): void
}

function VideoItem(props: Props) {
  const i18n = useI18n()

  return (
    <div>
      <div className={clsx(classes.container, 'flex-row')}>
        <ButtonBase style={{ width: '100%', textAlign: 'left' }} onClick={props.onClick}>
          <img src={props.thumbnailUrl} referrerPolicy="no-referrer" className="thumbnailImg" />
          <div className="flex-limit info">
            <div className="title com-textLimit">{props.title}</div>
            <div className="flex-row infoRow">
              <div className="infoItem">{i18n.viewCounts}：{props.viewCount}</div>
              <div className="infoItem">{i18n.likeCounts}：{props.likeCount}</div>
              <div className="infoItem">{i18n.favoriteCounts}：{props.mylistCount}</div>
            </div>
            <div className="flex-row infoRow">
              <div className="infoItem">{i18n.durationForVideoItem}：{props.duration}</div>
              <div className="infoItem">{i18n.commentCounts}：{props.commentCount}</div>
              <div className="infoItem" style={{ width: '18em' }}>{i18n.publishDate}：{props.publishTime}</div>
            </div>
            {/* <div className="flex-row">

            </div> */}
          </div>
        </ButtonBase>
      </div>
    </div>
  )
}

export default VideoItem
