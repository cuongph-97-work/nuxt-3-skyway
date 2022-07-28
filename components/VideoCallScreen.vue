<template>
  <div class="fullscreen-media-container video overlay">
    <video
      v-if="toolbar.shareOn"
      ref="shareScreenRef"
      :srcObject="remoteScreenStream"
      autoplay
      playsinline
      id="share-screen"
      oncontextmenu="return false;"
    ></video>
    <video
      v-else
      ref="remoteVideoRef"
      :srcObject="remoteVideoStream"
      autoplay
      playsinline
      id="remote-screen"
      oncontextmenu="return false;"
    ></video>
    <div class="overlay-content-container">
      <PartnerText />
      <ToolbarVideoCall />
      <MyCam />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useVideoStore } from '~~/stores/video'
const toolbarStore = useVideoStore()
const toolbar = computed(() => toolbarStore.getStatusToolbar)
const remoteVideoStream = computed(() => toolbarStore.getRemoteVideoStream)
const remoteScreenStream = computed(() => toolbarStore.getRemoteScreenStream)

const remoteVideoRef = ref()
const shareScreenRef = ref()
const emits = defineEmits(['onChangeToolbar'])
const toolbarConfig = reactive({
  shareScreen: {
    status: false,
    videoTrack: null,
    stream: null
  }
})
</script>
<style lang="scss">
@import '../assets/css/video_call_style.scss';
</style>
