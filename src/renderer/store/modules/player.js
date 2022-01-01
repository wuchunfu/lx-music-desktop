import path from 'path'
import music from '../../utils/music'
import {
  getRandom,
  checkPath,
  getLyric as getStoreLyric,
  setLyric,
  setMusicUrl,
  getMusicUrl as getStoreMusicUrl,
  assertApiSupport,
} from '@renderer/utils'
import { player as eventPlayerNames, list as eventListNames } from '@renderer/event/names'
import {
  setPlayList,
  setPlayMusicInfo,
  playedList,
  addPlayedList,
  removePlayedList,
  clearPlayedList,
  tempPlayList,
  addTempPlayList,
  removeTempPlayList,
  clearTempPlayeList,
  playInfo,
  playMusicInfo,
} from '@renderer/core/share/player'
import { tempList, updateList } from '@renderer/core/share/list'
import { getList } from '@renderer/core/share/utils'

// state
const state = {
}

const playMusic = () => {
  window.eventHub.emit(eventPlayerNames.playMusic)
}

const filterList = async({ playedList, listInfo, savePath, commit }) => {
  // if (this.list.listName === null) return
  let list
  let canPlayList = []
  const filteredPlayedList = playedList.filter(({ listId, isTempPlay }) => listInfo.id === listId && !isTempPlay).map(({ musicInfo }) => musicInfo)
  if (listInfo.id == 'download') {
    list = []
    for (const item of listInfo.list) {
      const filePath = path.join(savePath, item.metadata.fileName)
      if (!await checkPath(filePath) || !item.isComplate || /\.ape$/.test(filePath)) continue

      canPlayList.push(item)

      // 排除已播放音乐
      let index = filteredPlayedList.findIndex(m => m.songmid == item.songmid)
      if (index > -1) {
        filteredPlayedList.splice(index, 1)
        continue
      }
      list.push(item)
    }
  } else {
    list = listInfo.list.filter(s => {
      // if (!assertApiSupport(s.source)) return false
      canPlayList.push(s)

      let index = filteredPlayedList.findIndex(m => m.songmid == s.songmid)
      if (index > -1) {
        filteredPlayedList.splice(index, 1)
        return false
      }
      return true
    })
  }
  if (!list.length && playedList.length) {
    commit('clearPlayedList')
    return canPlayList
  }
  return list
}

const getMusicUrl = function(musicInfo, type, onToggleSource, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getMusicUrl(musicInfo, type).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    onToggleSource()
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source) || !assertApiSupport(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getMusicUrl.call(this, item, type, onToggleSource, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

const getPic = function(musicInfo, retryedSource = [], originMusic) {
  // console.log(musicInfo.source)
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getPic(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getPic.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}
const getLyric = function(musicInfo, retryedSource = [], originMusic) {
  if (!originMusic) originMusic = musicInfo
  let reqPromise
  try {
    reqPromise = music[musicInfo.source].getLyric(musicInfo).promise
  } catch (err) {
    reqPromise = Promise.reject(err)
  }
  return reqPromise.catch(err => {
    if (!retryedSource.includes(musicInfo.source)) retryedSource.push(musicInfo.source)
    return this.dispatch('list/getOtherSource', originMusic).then(otherSource => {
      console.log('find otherSource', otherSource)
      if (otherSource.length) {
        for (const item of otherSource) {
          if (retryedSource.includes(item.source)) continue
          console.log('try toggle to: ', item.source, item.name, item.singer, item.interval)
          return getLyric.call(this, item, retryedSource, originMusic)
        }
      }
      return Promise.reject(err)
    })
  })
}

// getters
const getters = {

}

// actions
const actions = {
  async getUrl({ commit, state }, { musicInfo, type, isRefresh, onToggleSource = () => {} }) {
    // if (!musicInfo._types[type]) {
    //   // 兼容旧版酷我源搜索列表过滤128k音质的bug
    //   if (!(musicInfo.source == 'kw' && type == '128k')) throw new Error('该歌曲没有可播放的音频')

    //   // return Promise.reject(new Error('该歌曲没有可播放的音频'))
    // }
    const cachedUrl = await getStoreMusicUrl(musicInfo, type)
    if (cachedUrl && !isRefresh) return cachedUrl

    return getMusicUrl.call(this, musicInfo, type, onToggleSource).then(({ url }) => {
      commit('setUrl', { musicInfo, url, type })
      return url
    }).catch(err => {
      return Promise.reject(err)
    })
  },
  getPic({ commit, state }, { musicInfo, listId }) {
    // if (picRequest && picRequest.cancelHttp) picRequest.cancelHttp()
    // picRequest = music[musicInfo.source].getPic(musicInfo)
    return getPic.call(this, musicInfo).then(url => {
      // picRequest = null
      commit('setPic', { musicInfo, url, listId })
    }).catch(err => {
      // picRequest = null
      return Promise.reject(err)
    })
  },
  async getLrc({ commit, state }, musicInfo) {
    const lrcInfo = await getStoreLyric(musicInfo)
    // if (lrcRequest && lrcRequest.cancelHttp) lrcRequest.cancelHttp()
    if (lrcInfo.lyric && lrcInfo.tlyric != null) {
      // if (musicInfo.lrc.startsWith('\ufeff[id:$00000000]')) {
      //   let str = musicInfo.lrc.replace('\ufeff[id:$00000000]\n', '')
      //   commit('setLrc', { musicInfo, lyric: str, tlyric: musicInfo.tlrc, lxlyric: musicInfo.tlrc })
      // } else if (musicInfo.lrc.startsWith('[id:$00000000]')) {
      //   let str = musicInfo.lrc.replace('[id:$00000000]\n', '')
      //   commit('setLrc', { musicInfo, lyric: str, tlyric: musicInfo.tlrc, lxlyric: musicInfo.tlrc })
      // }

      if ((lrcInfo.lxlyric == null && musicInfo.source != 'kg') || lrcInfo.lxlyric != null) return lrcInfo
    }

    // lrcRequest = music[musicInfo.source].getLyric(musicInfo)
    return getLyric.call(this, musicInfo).then(({ lyric, tlyric, lxlyric }) => {
      // lrcRequest = null
      commit('setLrc', { musicInfo, lyric, tlyric, lxlyric })
      return { lyric, tlyric, lxlyric }
    }).catch(err => {
      // lrcRequest = null
      return Promise.reject(err)
    })
  },

  async playPrev({ state, rootState, commit, getters }) {
    const currentListId = playInfo.playListId
    const currentList = getList(currentListId)
    if (playedList.length) {
      let currentSongmid
      if (playMusicInfo.isTempPlay) {
        const musicInfo = currentList[playInfo.listPlayIndex]
        if (musicInfo) currentSongmid = musicInfo.songmid
      } else {
        currentSongmid = playMusicInfo.musicInfo.songmid
      }
      // 从已播放列表移除播放列表已删除的歌曲
      let index
      for (index = playedList.findIndex(m => m.musicInfo.songmid === currentSongmid) - 1; index > -1; index--) {
        const playMusicInfo = playedList[index]
        const currentSongmid = playMusicInfo.musicInfo.songmid
        if (playMusicInfo.listId == currentListId && !currentList.some(m => m.songmid === currentSongmid)) {
          commit('removePlayedList', index)
          continue
        }
        break
      }

      if (index > -1) {
        commit('setPlayMusicInfo', playedList[index])
        playMusic()
        return
      }
    }

    let filteredList = await filterList({
      listInfo: { id: currentListId, list: currentList },
      playedList,
      savePath: rootState.setting.download.savePath,
      commit,
    })
    if (!filteredList.length) return commit('setPlayMusicInfo', { listId: null, musicInfo: null })

    let currentIndex = filteredList.indexOf(currentList[playInfo.listPlayIndex])
    if (currentIndex == -1 && filteredList.length) currentIndex = 0
    let nextIndex = currentIndex
    if (!playMusicInfo.isTempPlay) {
      switch (rootState.setting.player.togglePlayMethod) {
        case 'random':
          nextIndex = getRandom(0, filteredList.length)
          break
        case 'listLoop':
        case 'list':
          nextIndex = currentIndex === 0 ? filteredList.length - 1 : currentIndex - 1
          break
        case 'singleLoop':
          break
        default:
          nextIndex = -1
          return
      }
      if (nextIndex < 0) return
    }

    commit('setPlayMusicInfo', {
      musicInfo: filteredList[nextIndex],
      listId: currentListId,
    })
    playMusic()
  },
  async playNext({ state, rootState, commit, getters }) {
    if (tempPlayList.length) {
      const playMusicInfo = tempPlayList[0]
      commit('removeTempPlayList', 0)
      commit('setPlayMusicInfo', playMusicInfo)
      playMusic()
      return
    }

    // console.log(playInfo.playListId)
    const currentListId = playInfo.playListId
    const currentList = getList(currentListId)

    if (playedList.length) {
      let currentSongmid
      if (playMusicInfo.isTempPlay) {
        const musicInfo = currentList[playInfo.listPlayIndex]
        if (musicInfo) currentSongmid = musicInfo.songmid
      } else {
        currentSongmid = playMusicInfo.musicInfo.songmid
      }
      // 从已播放列表移除播放列表已删除的歌曲
      let index
      for (index = playedList.findIndex(m => m.musicInfo.songmid === currentSongmid) + 1; index < playedList.length; index++) {
        const playMusicInfo = playedList[index]
        const currentSongmid = playMusicInfo.musicInfo.songmid
        if (playMusicInfo.listId == currentListId && !currentList.some(m => m.songmid === currentSongmid)) {
          commit('removePlayedList', index)
          continue
        }
        break
      }

      if (index < playedList.length) {
        commit('setPlayMusicInfo', playedList[index])
        playMusic()
        return
      }
    }
    let filteredList = await filterList({
      listInfo: { id: currentListId, list: currentList },
      playedList,
      savePath: rootState.setting.download.savePath,
      commit,
    })

    if (!filteredList.length) return commit('setPlayMusicInfo', { listId: null, musicInfo: null })
    let currentIndex = filteredList.indexOf(currentList[playInfo.listPlayIndex])
    if (currentIndex == -1 && filteredList.length) currentIndex = 0
    let nextIndex = currentIndex

    switch (rootState.setting.player.togglePlayMethod) {
      case 'listLoop':
        nextIndex = currentIndex === filteredList.length - 1 ? 0 : currentIndex + 1
        break
      case 'random':
        nextIndex = getRandom(0, filteredList.length)
        break
      case 'list':
        nextIndex = currentIndex === filteredList.length - 1 ? -1 : currentIndex + 1
        break
      case 'singleLoop':
        break
      default:
        nextIndex = -1
        return
    }
    if (nextIndex < 0) return

    commit('setPlayMusicInfo', {
      musicInfo: filteredList[nextIndex],
      listId: currentListId,
    })
    playMusic()
  },
}


// mitations
const mutations = {
  setUrl(state, { musicInfo, type, url }) {
    setMusicUrl(musicInfo, type, url)
  },
  setPic(state, datas) {
    datas.musicInfo.img = datas.url
    this.commit('list/updateMusicInfo', {
      listId: datas.listId,
      id: datas.musicInfo.songmid,
      data: { img: datas.url },
      musicInfo: datas.musicInfo,
    })
  },
  setLrc(state, datas) {
    // datas.musicInfo.lrc = datas.lyric
    // datas.musicInfo.tlrc = datas.tlyric
    // datas.musicInfo.lxlrc = datas.lxlyric
    setLyric(datas.musicInfo, {
      lyric: datas.lyric,
      tlyric: datas.tlyric,
      lxlyric: datas.lxlyric,
    })
  },
  setList(state, { listId, index }) {
    const list = getList(listId)
    const musicInfo = list[index]
    if (!musicInfo) return
    setPlayList(listId)
    setPlayMusicInfo(listId, musicInfo)
    if (playedList.length) this.commit('player/clearPlayedList')
    if (tempPlayList.length) this.commit('player/clearTempPlayeList')
    playMusic()
  },
  setTempList(state, { list, id, index }) {
    updateList({ id: tempList.id, meta: { id }, list })
    this.commit('player/setList', {
      listId: tempList.id,
      index,
    })
    window.eventHub.emit(eventListNames.listChange, [tempList.id])
  },
  updateTempList(state, { id, list }) {
    updateList({ id: tempList.id, meta: { id }, list })
    window.eventHub.emit(eventListNames.listChange, [tempList.id])
  },
  // setPlayIndex(state, index) {
  //   state.playIndex = index
  // },
  setPlayedList(state, item) {
    // console.log(item)
    addPlayedList(item)
  },
  removePlayedList(state, index) {
    removePlayedList(index)
  },
  clearPlayedList(state) {
    clearPlayedList()
  },
  setTempPlayList(state, list) {
    addTempPlayList(list)
    if (!playMusicInfo.musicInfo) this.commit('player/playNext')
  },
  removeTempPlayList(state, index) {
    removeTempPlayList(index)
  },
  clearTempPlayeList(state) {
    clearTempPlayeList()
  },

  setPlayMusicInfo(state, { listId, musicInfo, isTempPlay }) {
    setPlayMusicInfo(listId, musicInfo, isTempPlay)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
