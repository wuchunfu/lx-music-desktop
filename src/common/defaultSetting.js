const path = require('path')
const os = require('os')

const defaultSetting = {
  version: '1.0.48',
  player: {
    togglePlayMethod: 'listLoop',
    highQuality: false,
    isShowTaskProgess: true,
    volume: 1,
    isMute: false,
    mediaDeviceId: 'default',
    isMediaDeviceRemovedStopPlay: false,
    isShowLyricTranslation: false,
    isS2t: false, // 是否将歌词从简体转换为繁体
    isPlayLxlrc: true,
    isSavePlayTime: false,
    audioVisualization: false,
  },
  desktopLyric: {
    enable: false,
    isLock: false,
    isAlwaysOnTop: false,
    width: 380,
    height: 420,
    x: null,
    y: null,
    theme: 0,
    isLockScreen: true,
    isDelayScroll: true,
    style: {
      font: '',
      fontSize: 120,
      opacity: 95,
      isZoomActiveLrc: true,
    },
  },
  list: {
    isShowAlbumName: true,
    isShowSource: true,
    isSaveScrollLocation: true,
    addMusicLocationType: 'top',
  },
  download: {
    enable: false,
    savePath: path.join(os.homedir(), 'Desktop'),
    fileName: '歌名 - 歌手',
    maxDownloadNum: 3,
    isDownloadLrc: false,
    lrcFormat: 'utf8',
    isEmbedPic: true,
    isEmbedLyric: false,
    isUseOtherSource: false,
  },
  leaderboard: {
    source: 'kw',
    tabId: 'kw__16',
  },
  songList: {
    source: 'kg',
    sortId: '5',
    tagInfo: {
      name: '默认',
      id: null,
    },
  },
  odc: {
    isAutoClearSearchInput: false,
    isAutoClearSearchList: false,
  },
  search: {
    searchSource: 'all',
    tempSearchSource: 'kw',
    isShowHotSearch: false,
    isShowHistorySearch: false,
    isFocusSearchBox: false,
  },
  network: {
    proxy: {
      enable: false,
      host: '',
      port: '',
      username: '',
      password: '',
    },
  },
  tray: {
    isShow: false,
    isToTray: false,
    themeId: 0,
  },
  sync: {
    enable: false,
    port: '23332',
  },
  windowSizeId: 2,
  themeId: 0,
  langId: null,
  sourceId: 'kw',
  apiSource: 'temp',
  sourceNameType: 'alias',
  isShowAnimation: true,
  randomAnimate: true,
  ignoreVersion: null,
  isAgreePact: false,
  controlBtnPosition: process.platform === 'darwin' ? 'left' : 'right',
}

const overwriteSetting = {

}

// 使用新年皮肤
if (new Date().getMonth() < 2) {
  defaultSetting.themeId = 9
  defaultSetting.desktopLyric.theme = 3
}


exports.defaultSetting = defaultSetting
exports.overwriteSetting = overwriteSetting
