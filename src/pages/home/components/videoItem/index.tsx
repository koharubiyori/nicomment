import { ButtonBase, MenuItem, MenuList, Paper, Popover, PopoverPosition } from '@material-ui/core'
import clsx from 'clsx'
import React, { MouseEvent, useRef, useState } from 'react'
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
  onActionClick: (action: VideoItemAction) => void
}

export type VideoItemAction = 'showDanmakuPreModal' | 'gotoVideoContent'

function VideoItem(props: Props) {
  const i18n = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<PopoverPosition>({ left: 0, top: 0 })
  const containerRef = useRef<any>()

  function handleOnMouseRightClick(e: MouseEvent) {
    if (e.button !== 2) { return }
    setIsOpen(true)
    setMenuPosition({ left: e.clientX, top: e.clientY })
  }

  function triggerAction(action: VideoItemAction) {
    props.onActionClick(action)
    setIsOpen(false)
  }

  return (
    <div className={clsx(classes.container, 'flex-row')} ref={containerRef}>
      <ButtonBase
        style={{ width: '100%', textAlign: 'left' }}
        onClick={props.onClick}
        onMouseDown={handleOnMouseRightClick}
      >
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
      <Popover
        open={isOpen}
        anchorEl={document.body}
        anchorReference="anchorPosition"
        anchorPosition={menuPosition}
        onClose={() => setIsOpen(false)}
      >
        <Paper>
          <MenuList>
            <MenuItem onClick={() => triggerAction('showDanmakuPreModal')}>{i18n.danmakuPretreatment}</MenuItem>
            <MenuItem onClick={() => triggerAction('gotoVideoContent')}>{i18n.gotoVideoPage}</MenuItem>
          </MenuList>
        </Paper>
      </Popover>
    </div>
  )
}

export default VideoItem
