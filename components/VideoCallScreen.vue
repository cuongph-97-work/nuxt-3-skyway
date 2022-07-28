<template>
  <div class="fullscreen-media-container video overlay">
    <video
      ref="shareScreenRef"
      autoplay
      playsinline
      id="share-screen"
      oncontextmenu="return false;"
    ></video>
    <!-- <video
      ref="remoteVideoRef"
      autoplay
      playsinline
      v-else="!isSharing"
      id="remote-screen"
      oncontextmenu="return false;"
    ></video> -->
    <div class="overlay-content-container">
      <PartnerText />
      <ToolbarVideoCall
        :is-sharing="isSharing"
        @on-off-mic="onOffMic"
        @on-share="onShareScreen"
        @on-stop-share="onStopShare"
      />
      <MyCam :src="props.myVideoStream" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui'
interface Props {
  myVideoStream: any
  remoteVideoStream: any
  remoteShareStream: any
}
const isSharing = ref(false)
const remoteVideoRef = ref()
const shareScreenRef = ref()

const props = defineProps<Props>()
const emits = defineEmits(['onChangeToolbar'])
function onOffMic(status: boolean) {
  props.myVideoStream.getAudioTracks().forEach((track: any) => {
    track.enabled = status
  })
}
const toolbarConfig = reactive({
  shareScreen: {
    status: false,
    videoTrack: null,
    stream: null
  }
})
function onStopShare() {
  const tracks = shareScreenRef.value.srcObject.getTracks()
  tracks.forEach((track: any) => track.stop())
  nextTick(() => {
    toolbarConfig.shareScreen = {
      status: false,
      videoTrack: null,
      stream: null
    }
    emits('onChangeToolbar', toolbarConfig)
    isSharing.value = false
  })
}
function onShareScreen() {
  isSharing.value = true
  const displayMediaOptions = {
    video: true,
    audio: false
    // audio: {
    //   echoCancellation: true,
    //   noiseSuppression: true
    // }
  }
  nextTick(() => {
    navigator.mediaDevices
      .getDisplayMedia(displayMediaOptions)
      .then((screenStream) => {
        shareScreenRef.value.srcObject = screenStream
        screenStream.getVideoTracks().forEach((videoTrack) => {
          videoTrack.onended = () => {
            isSharing.value = false
            toolbarConfig.shareScreen = {
              status: false,
              videoTrack: null,
              stream: null
            }
            emits('onChangeToolbar', toolbarConfig)
            return
          }
        })

        Object.assign(toolbarConfig.shareScreen, {
          status: true,
          stream: screenStream
        })
        emits('onChangeToolbar', toolbarConfig)
      })
      .catch((err) => {
        console.log('Unable to get display media ' + err)
      })
  })
}
// watch(
//   () => props.remoteVideoStream,
//   (stream) => {
//     if (stream) {
//       remoteVideoRef.value.srcObject = stream
//     } else {
//       remoteVideoRef.value.srcObject
//         .getTracks()
//         .forEach((track: any) => track.stop())
//     }
//   }
// )
watch(
  () => props.remoteShareStream,
  (stream) => {
    console.log('===========================> ', stream)
    if (stream) {
      shareScreenRef.value.srcObject = stream
    } else {
      shareScreenRef.value.srcObject
        .getTracks()
        .forEach((track: any) => track.stop())
    }
  }
)
</script>
<style lang="scss">
@import '../assets/css/video_call_style.scss';
</style>
