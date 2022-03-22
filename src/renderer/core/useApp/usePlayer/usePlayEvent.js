import { onBeforeUnmount, useI18n } from '@renderer/utils/vueTools'
import { player as eventPlayerNames } from '@renderer/event/names'
import { wait, waitCancel } from '@renderer/utils/tools'
import { musicInfo, musicInfoItem, playMusicInfo } from '@renderer/core/share/player'

export default ({
  playNext,
  setAllStatus,
  setUrl,
}) => {
  const { t } = useI18n()
  let retryNum = 0
  let prevTimeoutId = null

  let loadingTimeout
  let delayNextTimeout
  const startLoadingTimeout = () => {
    // console.log('start load timeout')
    clearLoadingTimeout()
    loadingTimeout = Math.random()
    wait(25000, loadingTimeout).then(() => {
      // 如果加载超时，则尝试刷新URL
      if (prevTimeoutId == musicInfo.songmid) {
        prevTimeoutId = null
        playNext()
      } else {
        prevTimeoutId = musicInfo.songmid
        setUrl(musicInfoItem.value, true)
      }
    }).catch(_ => _)
  }
  const clearLoadingTimeout = () => {
    if (!loadingTimeout) return
    // console.log('clear load timeout')
    waitCancel(loadingTimeout)
    loadingTimeout = null
  }

  const clearDelayNextTimeout = () => {
    // console.log(this.delayNextTimeout)
    if (!delayNextTimeout) return
    waitCancel(delayNextTimeout)
    delayNextTimeout = null
  }
  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    delayNextTimeout = Math.random()
    wait(5000, delayNextTimeout).then(playNext).catch(_ => _)
  }

  const handleLoadstart = () => {
    if (global.isPlayedStop) return
    startLoadingTimeout()
    setAllStatus(t('player__loading'))
  }

  const handleLoadeddata = () => {
    setAllStatus(t('player__loading'))
  }

  const handleCanplay = () => {
    setAllStatus('')
  }

  const handlePlaying = () => {
    clearLoadingTimeout()
  }

  const handleEmpied = () => {
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  const handleWating = () => {
    setAllStatus(t('player__buffering'))
  }

  const handleError = errCode => {
    if (!musicInfo.songmid) return
    clearLoadingTimeout()
    if (global.isPlayedStop) return
    if (playMusicInfo.listId != 'download' && errCode !== 1 && retryNum < 2) { // 若音频URL无效则尝试刷新2次URL
      // console.log(this.retryNum)
      retryNum++
      setUrl(musicInfoItem.value, true)
      setAllStatus(t('player__refresh_url'))
      return
    }

    setAllStatus(t('player__error'))
    addDelayNextTimeout()
  }

  const handleSetPlayInfo = () => {
    retryNum = 0
    prevTimeoutId = null
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  const handlePlayedStop = () => {
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }


  window.eventHub.on(eventPlayerNames.player_loadstart, handleLoadstart)
  window.eventHub.on(eventPlayerNames.player_loadeddata, handleLoadeddata)
  window.eventHub.on(eventPlayerNames.player_canplay, handleCanplay)
  window.eventHub.on(eventPlayerNames.player_playing, handlePlaying)
  window.eventHub.on(eventPlayerNames.player_waiting, handleWating)
  window.eventHub.on(eventPlayerNames.player_emptied, handleEmpied)
  window.eventHub.on(eventPlayerNames.error, handleError)
  window.eventHub.on(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
  window.eventHub.on(eventPlayerNames.playedStop, handlePlayedStop)

  onBeforeUnmount(() => {
    window.eventHub.off(eventPlayerNames.player_loadstart, handleLoadstart)
    window.eventHub.off(eventPlayerNames.player_loadeddata, handleLoadeddata)
    window.eventHub.off(eventPlayerNames.player_canplay, handleCanplay)
    window.eventHub.off(eventPlayerNames.player_playing, handlePlaying)
    window.eventHub.off(eventPlayerNames.player_waiting, handleWating)
    window.eventHub.off(eventPlayerNames.player_emptied, handleEmpied)
    window.eventHub.off(eventPlayerNames.error, handleError)
    window.eventHub.off(eventPlayerNames.setPlayInfo, handleSetPlayInfo)
    window.eventHub.off(eventPlayerNames.playedStop, handlePlayedStop)
  })
}
