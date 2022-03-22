import { ref, reactive, shallowRef, markRaw } from '@renderer/utils/vueTools'
import { windowSizeList as configWindowSizeList, themes as configThemes, themeLights as themeLightIds, themeDarks as themeDarkIds } from '@common/config'
import { version } from '../../../../package.json'
process.versions.app = version

export const apiSource = ref(null)
export const isShowPact = window.isShowPact = ref(false)
export const proxy = reactive({})
export const versionInfo = window.versionInfo = reactive({
  version,
  newVersion: null,
  showModal: false,
  isError: false,
  isTimeOut: false,
  isUnknow: false,
  isDownloaded: false,
  isDownloading: false,
  isLatestVer: false,
  downloadProgress: null,
})
export const userApi = reactive({
  list: [],
  status: false,
  message: 'initing',
  apis: {},
})
export const sync = window.sync = reactive({
  enable: false,
  isShowSyncMode: false,
  deviceName: '',
  status: {
    status: false,
    message: '',
    address: [],
    code: '',
    devices: [],
  },
})
export const isFullscreen = ref(false)

export const windowSizeList = markRaw(configWindowSizeList)
export const themes = markRaw(configThemes)
export const themeLights = markRaw(configThemes.filter(t => themeLightIds.includes(t.id)))
export const themeDarks = markRaw(configThemes.filter(t => themeDarkIds.includes(t.id)))
export const themeShouldUseDarkColors = ref(window.shouldUseDarkColors)
delete window.shouldUseDarkColors

export const qualityList = shallowRef({})
export const setQualityList = _qualityList => {
  qualityList.value = _qualityList
}
